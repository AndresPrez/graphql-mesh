import { isAbsolute, join, resolve } from 'path';
import { MeshResolvedSource } from '@graphql-mesh/runtime';
import {
  ImportFn,
  jsonSchema,
  Logger,
  MeshHandlerLibrary,
  MeshMerger,
  MeshMergerLibrary,
  MeshPubSub,
  MeshTransform,
  MeshTransformLibrary,
  YamlConfig,
} from '@graphql-mesh/types';
import { IResolvers, Source } from '@graphql-tools/utils';
import Ajv from 'ajv';
import { cosmiconfig, defaultLoaders } from 'cosmiconfig';
import { KeyValueCache } from 'fetchache';
import { DocumentNode } from 'graphql';
import {
  getPackage,
  resolveAdditionalTypeDefs,
  resolveCache,
  resolvePubSub,
  resolveDocuments,
  resolveLogger,
} from './utils';
import { FsStoreStorageAdapter, MeshStore, InMemoryStoreStorageAdapter } from '@graphql-mesh/store';
import { cwd, env } from 'process';
import { pascalCase } from 'pascal-case';
import { camelCase } from 'camel-case';
import { resolveAdditionalResolvers } from '@graphql-mesh/utils';

export type ConfigProcessOptions = {
  dir?: string;
  ignoreAdditionalResolvers?: boolean;
  importFn?: (moduleId: string) => Promise<any>;
  store?: MeshStore;
};

// TODO: deprecate this in next major release as dscussed in #1687
export async function parseConfig(
  rawConfig: YamlConfig.Config | string,
  options?: { configFormat?: 'yaml' | 'json' | 'object' } & ConfigProcessOptions
) {
  let config: YamlConfig.Config;
  const { configFormat = 'object', dir: configDir = '' } = options || {};
  const dir = isAbsolute(configDir) ? configDir : join(cwd(), configDir);

  switch (configFormat) {
    case 'yaml':
      config = defaultLoaders['.yaml']('.meshrc.yml', rawConfig as string);
      break;
    case 'json':
      config = defaultLoaders['.json']('.meshrc.json', rawConfig as string);
      break;
    case 'object':
      config = rawConfig as YamlConfig.Config;
      break;
  }

  return processConfig(config, { ...options, dir });
}

export type ProcessedConfig = {
  sources: MeshResolvedSource<any>[];
  transforms: MeshTransform[];
  additionalTypeDefs: DocumentNode[];
  additionalResolvers: IResolvers[];
  cache: KeyValueCache<string>;
  merger: MeshMerger;
  pubsub: MeshPubSub;
  config: YamlConfig.Config;
  documents: Source[];
  logger: Logger;
  store: MeshStore;
  code: string;
};

function getDefaultMeshStore(dir: string, importFn: ImportFn) {
  const isProd = env.NODE_ENV?.toLowerCase() === 'production';
  const storeStorageAdapter = isProd
    ? new FsStoreStorageAdapter({
        cwd: dir,
        importFn,
      })
    : new InMemoryStoreStorageAdapter();
  return new MeshStore(resolve(dir, '.mesh'), storeStorageAdapter, {
    /**
     * TODO:
     * `mesh start` => { readonly: true, validate: false }
     * `mesh dev` => { readonly: false, validate: true } => validation error should show a prompt for confirmation
     * `mesh validate` => { readonly: true, validate: true } => should fetch from remote and try to update
     * readonly
     */
    readonly: isProd,
    validate: false,
  });
}

export async function processConfig(
  config: YamlConfig.Config,
  options?: ConfigProcessOptions
): Promise<ProcessedConfig> {
  const importCodes: string[] = [`import { GetMeshOptions } from '@graphql-mesh/runtime';`];
  const codes: string[] = [
    `export const rawConfig = ${JSON.stringify(config)}`,
    `export async function getMeshOptions(): Promise<GetMeshOptions> {`,
  ];

  const {
    dir,
    ignoreAdditionalResolvers = false,
    importFn = (moduleId: string) => import(moduleId).then(m => m.default || m),
    store: providedStore,
  } = options || {};

  if (config.require) {
    await Promise.all(config.require.map(mod => importFn(mod)));
    for (const mod of config.require) {
      importCodes.push(`import '${mod}';`);
    }
  }

  const rootStore = providedStore || getDefaultMeshStore(dir, importFn);

  const {
    cache,
    importCode: cacheImportCode,
    code: cacheCode,
  } = await resolveCache(config.cache, importFn, rootStore, dir);
  importCodes.push(cacheImportCode);
  codes.push(cacheCode);

  const { pubsub, importCode: pubsubImportCode, code: pubsubCode } = await resolvePubSub(config.pubsub, importFn, dir);
  importCodes.push(pubsubImportCode);
  codes.push(pubsubCode);

  const sourcesStore = rootStore.child('sources');
  codes.push(`const sourcesStore = rootStore.child('sources');`);

  const { logger, importCode: loggerImportCode, code: loggerCode } = await resolveLogger(config.logger, importFn, dir);
  importCodes.push(loggerImportCode);
  codes.push(loggerCode);

  codes.push(`const sources = [];`);
  codes.push(`const transforms = [];`);

  const [sources, transforms, additionalTypeDefs, additionalResolvers, merger, documents] = await Promise.all([
    Promise.all(
      config.sources.map<Promise<MeshResolvedSource>>(async source => {
        const handlerName = Object.keys(source.handler)[0].toString();
        const handlerConfig = source.handler[handlerName];
        const handlerVariableName = camelCase(`${source.name}_Handler`);
        const transformsVariableName = camelCase(`${source.name}_Transforms`);
        codes.push(`const ${transformsVariableName} = [];`);
        const [handler, transforms] = await Promise.all([
          await getPackage<MeshHandlerLibrary>(handlerName, 'handler', importFn, dir).then(
            ({ resolved: HandlerCtor, moduleName }) => {
              const handlerImportName = pascalCase(handlerName + '_Handler');
              importCodes.push(`import ${handlerImportName} from '${moduleName}'`);
              codes.push(`const ${handlerVariableName} = new ${handlerImportName}({
              name: '${source.name}',
              config: ${JSON.stringify(handlerConfig, null, 2)},
              baseDir,
              cache,
              pubsub,
              store: sourcesStore.child('${source.name}'),
              logger: logger.child('${source.name}'),
            });`);
              return new HandlerCtor({
                name: source.name,
                config: handlerConfig,
                baseDir: dir,
                cache,
                pubsub,
                store: sourcesStore.child(source.name),
                logger: logger.child(source.name),
              });
            }
          ),
          Promise.all(
            (source.transforms || []).map(async t => {
              const transformName = Object.keys(t)[0].toString();
              const transformConfig = t[transformName];
              const { resolved: TransformCtor, moduleName } = await getPackage<MeshTransformLibrary>(
                transformName,
                'transform',
                importFn,
                dir
              );

              const transformImportName = pascalCase(transformName + '_Transform');
              importCodes.push(`import ${transformImportName} from '${moduleName}';`);
              codes.push(`${transformsVariableName}.push(
                new ${transformImportName}({
                  apiName: '${source.name}',
                  config: ${JSON.stringify(transformConfig, null, 2)},
                  baseDir,
                  cache,
                  pubsub,
                })
              );`);

              return new TransformCtor({
                apiName: source.name,
                config: transformConfig,
                baseDir: dir,
                cache,
                pubsub,
              });
            })
          ),
        ]);

        codes.push(`sources.push({
          name: '${source.name}',
          handler: ${handlerVariableName},
          transforms: ${transformsVariableName}
        })`);

        return {
          name: source.name,
          handler,
          transforms,
        };
      })
    ),
    Promise.all(
      config.transforms?.map(async t => {
        const transformName = Object.keys(t)[0].toString();
        const transformConfig = t[transformName];
        const { resolved: TransformLibrary, moduleName } = await getPackage<MeshTransformLibrary>(
          transformName,
          'transform',
          importFn,
          dir
        );

        const transformImportName = pascalCase(transformName + '_Transform');
        importCodes.push(`import ${transformImportName} from '${moduleName}';`);

        codes.push(`transforms.push(
          new ${transformImportName}({
            apiName: '',
            config: ${JSON.stringify(transformConfig, null, 2)},
            baseDir,
            cache,
            pubsub
          })
        )`);
        return new TransformLibrary({
          apiName: '',
          config: transformConfig,
          baseDir: dir,
          cache,
          pubsub,
        });
      }) || []
    ),
    resolveAdditionalTypeDefs(dir, config.additionalTypeDefs).then(additionalTypeDefs => {
      codes.push(`const additionalTypeDefs = ${JSON.stringify(additionalTypeDefs)} as any;`);
      return additionalTypeDefs;
    }),
    resolveAdditionalResolvers(
      dir,
      ignoreAdditionalResolvers ? [] : config.additionalResolvers || [],
      importFn,
      pubsub
    ),
    getPackage<MeshMergerLibrary>(config.merger || 'stitching', 'merger', importFn, dir).then(
      ({ resolved: Merger, moduleName }) => {
        const mergerImportName = pascalCase(`${config.merger || 'stitching'}Merger`);
        importCodes.push(`import ${mergerImportName} from '${moduleName}';`);
        codes.push(`const merger = new(${mergerImportName} as any)({
        cache,
        pubsub,
        logger: logger.child('${mergerImportName}'),
        store: rootStore.child('${config.merger || 'stitching'}Merger')
      })`);
        return new Merger({
          cache,
          pubsub,
          logger: logger.child(mergerImportName),
          store: rootStore.child(`${config.merger || 'stitching'}Merger`),
        });
      }
    ),
    resolveDocuments(config.documents, dir),
  ]);

  importCodes.push(`import { resolveAdditionalResolvers } from '@graphql-mesh/utils';`);
  codes.push(`const additionalResolvers = await resolveAdditionalResolvers(
      baseDir,
      ${JSON.stringify(config.additionalResolvers)},
      importFn,
      pubsub
  )`);

  codes.push(`const liveQueryInvalidations = ${JSON.stringify(config.liveQueryInvalidations)};`);

  codes.push(`
  return {
    sources,
    transforms,
    additionalTypeDefs,
    additionalResolvers,
    cache,
    pubsub,
    merger,
    logger,
    liveQueryInvalidations,
  };
}`);
  return {
    sources,
    transforms,
    additionalTypeDefs,
    additionalResolvers,
    cache,
    merger,
    pubsub,
    config,
    documents,
    logger,
    store: rootStore,
    code: [...new Set([...importCodes, ...codes])].join('\n'),
  };
}

function customLoader(ext: 'json' | 'yaml' | 'js') {
  function loader(filepath: string, content: string) {
    if (env) {
      content = content.replace(/\$\{(.*?)\}/g, (_, variable) => {
        let varName = variable;
        let defaultValue = '';

        if (variable.includes(':')) {
          const spl = variable.split(':');
          varName = spl.shift();
          defaultValue = spl.join(':');
        }

        return env[varName] || defaultValue;
      });
    }

    if (ext === 'json') {
      return defaultLoaders['.json'](filepath, content);
    }

    if (ext === 'yaml') {
      return defaultLoaders['.yaml'](filepath, content);
    }

    if (ext === 'js') {
      return defaultLoaders['.js'](filepath, content);
    }
  }

  return loader;
}

export function validateConfig(config: any): asserts config is YamlConfig.Config {
  const ajv = new Ajv({
    strict: false,
  });
  jsonSchema.$schema = undefined;
  const isValid = ajv.validate(jsonSchema, config);
  if (!isValid) {
    console.warn(`GraphQL Mesh Configuration is not valid:\n${ajv.errorsText()}`);
  }
}

export async function findAndParseConfig(options?: { configName?: string } & ConfigProcessOptions) {
  const { configName = 'mesh', dir: configDir = '', ignoreAdditionalResolvers = false, ...restOptions } = options || {};
  const dir = isAbsolute(configDir) ? configDir : join(cwd(), configDir);
  const explorer = cosmiconfig(configName, {
    loaders: {
      '.json': customLoader('json'),
      '.yaml': customLoader('yaml'),
      '.yml': customLoader('yaml'),
      '.js': customLoader('js'),
      noExt: customLoader('yaml'),
    },
  });
  const results = await explorer.search(dir);

  if (!results) {
    throw new Error(`No mesh config file was found in "${dir}"!`);
  }

  const config = results.config;
  validateConfig(config);
  return processConfig(config, { dir, ignoreAdditionalResolvers, ...restOptions });
}
