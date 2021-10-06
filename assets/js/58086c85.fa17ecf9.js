"use strict";(self.webpackChunk_graphql_mesh_website=self.webpackChunk_graphql_mesh_website||[]).push([[2269],{5318:function(e,n,t){t.d(n,{Zo:function(){return c},kt:function(){return d}});var r=t(7378);function a(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function o(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);n&&(r=r.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,r)}return t}function i(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?o(Object(t),!0).forEach((function(n){a(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):o(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function l(e,n){if(null==e)return{};var t,r,a=function(e,n){if(null==e)return{};var t,r,a={},o=Object.keys(e);for(r=0;r<o.length;r++)t=o[r],n.indexOf(t)>=0||(a[t]=e[t]);return a}(e,n);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)t=o[r],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(a[t]=e[t])}return a}var p=r.createContext({}),s=function(e){var n=r.useContext(p),t=n;return e&&(t="function"==typeof e?e(n):i(i({},n),e)),t},c=function(e){var n=s(e.components);return r.createElement(p.Provider,{value:n},e.children)},u={inlineCode:"code",wrapper:function(e){var n=e.children;return r.createElement(r.Fragment,{},n)}},m=r.forwardRef((function(e,n){var t=e.components,a=e.mdxType,o=e.originalType,p=e.parentName,c=l(e,["components","mdxType","originalType","parentName"]),m=s(t),d=a,f=m["".concat(p,".").concat(d)]||m[d]||u[d]||o;return t?r.createElement(f,i(i({ref:n},c),{},{components:t})):r.createElement(f,i({ref:n},c))}));function d(e,n){var t=arguments,a=n&&n.mdxType;if("string"==typeof e||a){var o=t.length,i=new Array(o);i[0]=m;var l={};for(var p in n)hasOwnProperty.call(n,p)&&(l[p]=n[p]);l.originalType=e,l.mdxType="string"==typeof e?e:a,i[1]=l;for(var s=2;s<o;s++)i[s]=t[s];return r.createElement.apply(null,i)}return r.createElement.apply(null,t)}m.displayName="MDXCreateElement"},7896:function(e,n,t){t.r(n),t.d(n,{frontMatter:function(){return l},metadata:function(){return p},toc:function(){return s},default:function(){return u}});var r=t(5773),a=t(808),o=(t(7378),t(5318)),i=["components"],l={id:"neo4j",title:"Neo4j",sidebar_label:"Neo4j"},p={unversionedId:"handlers/neo4j",id:"handlers/neo4j",isDocsHomePage:!1,title:"Neo4j",description:"image",source:"@site/docs/handlers/neo4j.md",sourceDirName:"handlers",slug:"/handlers/neo4j",permalink:"/docs/handlers/neo4j",editUrl:"https://github.com/urigo/graphql-mesh/edit/master/website/docs/handlers/neo4j.md",version:"current",sidebar_label:"Neo4j",frontMatter:{id:"neo4j",title:"Neo4j",sidebar_label:"Neo4j"},sidebar:"sidebar",previous:{title:"MySQL",permalink:"/docs/handlers/mysql"},next:{title:"Schema Transformation",permalink:"/docs/transforms/transforms-introduction"}},s=[{value:"Config API Reference",id:"config-api-reference",children:[]}],c={toc:s};function u(e){var n=e.components,t=(0,a.Z)(e,i);return(0,o.kt)("wrapper",(0,r.Z)({},c,t,{components:n,mdxType:"MDXLayout"}),(0,o.kt)("p",null,(0,o.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/20847995/79219440-f1605480-7e5a-11ea-980e-6ba54ee1450e.png",alt:"image"})),(0,o.kt)("p",null,"This handler allows you to use GraphQL schema created by ",(0,o.kt)("inlineCode",{parentName:"p"},"neo4j-graphql-js"),"."),(0,o.kt)("p",null,"To get started, install the handler library from NPM:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"$ yarn add @graphql-mesh/neo4j\n")),(0,o.kt)("p",null,"Now, you can use it directly in your Mesh config file:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-yml"},"sources:\n  - name: Neo4j\n    handler:\n      neo4j:\n        url: neo4j://localhost\n        username: neo4j\n        password: MY_PASSWORD\n\n")),(0,o.kt)("blockquote",null,(0,o.kt)("p",{parentName:"blockquote"},"You can check out our example that uses Neo4j handler.\n",(0,o.kt)("a",{parentName:"p",href:"https://github.com/Urigo/graphql-mesh/tree/master/examples/neo4j-example"},"Click here to open the example on GitHub"))),(0,o.kt)("h2",{id:"config-api-reference"},"Config API Reference"),(0,o.kt)("p",null,(0,o.kt)("ul",{parentName:"p"},(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("inlineCode",{parentName:"li"},"url")," (type: ",(0,o.kt)("inlineCode",{parentName:"li"},"String"),", required) - URL for the Neo4j Instance e.g. neo4j://localhost"),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("inlineCode",{parentName:"li"},"username")," (type: ",(0,o.kt)("inlineCode",{parentName:"li"},"String"),", required) - Username for basic authentication"),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("inlineCode",{parentName:"li"},"password")," (type: ",(0,o.kt)("inlineCode",{parentName:"li"},"String"),", required) - Password for basic authentication"),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("inlineCode",{parentName:"li"},"alwaysIncludeRelationships")," (type: ",(0,o.kt)("inlineCode",{parentName:"li"},"Boolean"),") - Specifies whether relationships should always be included in the type definitions as ",(0,o.kt)("a",{parentName:"li",href:"https://grandstack.io/docs/neo4j-graphql-js.html#relationship-types"},"relationship")," types, even if the relationships do not have properties."),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("inlineCode",{parentName:"li"},"database")," (type: ",(0,o.kt)("inlineCode",{parentName:"li"},"String"),") - Specifies database name"),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("inlineCode",{parentName:"li"},"typeDefs")," (type: ",(0,o.kt)("inlineCode",{parentName:"li"},"String"),") - Provide GraphQL Type Definitions instead of inferring"))))}u.isMDXComponent=!0}}]);