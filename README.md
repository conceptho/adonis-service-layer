# @conceptho/adonis-service-layer
![Codecov](https://img.shields.io/codecov/c/github/conceptho/adonis-service-layer.svg?logo=codecov&style=for-the-badge)
![CircleCI branch](https://img.shields.io/circleci/project/github/conceptho/adonis-service-layer/master.svg?logo=circleci&style=for-the-badge)
![npm (tag)](https://img.shields.io/npm/v/@conceptho/adonis-service-layer/latest.svg?color=green&logo=npm&style=for-the-badge)

| Namespace               | Exports                                                        |
| :---------------------- | :------------------------------------------------------------- |
| `Conceptho/Models`      | `{ Model }`                                                    |
| `Conceptho/Exceptions`  | `{ HttpCodeException, ValidationException, ServiceException }` |
| `Conceptho/Serializers` | `{ DefaultSerializer }`                                        |
| `Conceptho/Controllers` | `{ Controller }`                                               |
| `Conceptho/Services`    | `{ Service, ServiceResponse }`                                 |

Each middleware is defined in its own namespace:

|                Middleware                |
|:----------------------------------------:|
| `Conceptho/Middlewares/UseTransaction`   |
| `Conceptho/Middlewares/HeaderPagination` |


### Make Command Line

1. Register Command Lines in `start/app.js`

```js

const commands = [
  ...,
  '@conceptho/adonis-service-layer/src/Commands/Make/Controller',
  '@conceptho/adonis-service-layer/src/Commands/Make/Model',
  '@conceptho/adonis-service-layer/src/Commands/Make/Service'
]

```


### Model Documentation

1. The Model has an filter operation attached to the query builder with the name scopeFilter
he is used to help the search possible used by query params in a request for example he has
some operations mapping as defined based on some comparison operator and functions of sql:

| operatorKey       | operation          | operatorDescription                         |
| :---------------- | :----------------- | :----------------------------------------   |
| gt                | '>'                | GREATER THEN                                |  
| gte               | '>='               | GREATHER THEN EQUAL                         |
| lt                | '<'                | LESS THEN                                   |
| lte               | '<='               | LESS THEN EQUAL                             |
| eq                | '='                | EQUAL                                       |
| neq               | '<>'               | NOT EQUAL                                   |
| in                | 'IN'               | IN A GROUP OF VALUES COMMA SEPARETED        |
| nin               | 'NOT IN'           | NOT IN A GROUP OF VALUES COMMA SEPARETED    |
| between           | 'BETWEEN'          | BETWEEN TWO VALUES                          |
| nbetween          | 'NOT BETWEEN'      | NOT BETWEEN TWO VALUES                      |
| like              | 'LIKE'             | SEARCH FOR DATA WITH THE SPECIFIED VALUE    | 

1.1 to use the filter function and these operations the object provided to the function should have the  
following signature considering you should also define the attributes in the model that can be used in 
this function at the canBeFiltered static method in the Model:

```js
/**
* 'attr' is the name of the attribute to be filtered
* 'operatorKey' is the operatorKey to be used 
* 'value' is the value to be used to filter
*/
const filterData = { 'attr:operatorKey' : 'value' }
```
1.2 Example:
```js
...
// app/Models/User.js
const { Model } = use('Conceptho/Models')
class User extends Model {
  static get canBeFiltered () {
    return ['id', 'email']
  }
}
...

const query = User.query()
// Return all the Users with id lesser than 3
const queryDataById = await query.filter({ 'id:lt': 3 }).fetch()

// Returns all the Users that contain the pattern '@gmail.com'
const queryDataByEmail = await query.filter({ 'email:like': '@gmail.com' }).fetch()

```
