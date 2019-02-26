# Adonis Service Layer

Adonis Service Layer adds a layer for database and logic handling outside of the controller, for reuse in some situations.

## Installation 

1. Add package: 

```bash
$ npm i @conceptho/adonis-service-layer --save
```
or 

```bash
$ yarn add @conceptho/adonis-service-layer 
```
2. Register Adonis Service Layer providers inside the start/app.js file.

```js
const providers = [
    ...
    '@conceptho/adonis-service-layer/provider',
    ...
]
```


3. Setting up aliases inside `start/app.js` file.

```js
const aliases = {
    ...
    ConcepthoService: 'Conceptho/ServiceLayer',
    ...
}
```