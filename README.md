# @conceptho/adonis-service-layer
[![codecov](https://codecov.io/gh/conceptho/adonis-service-layer/branch/v1.0/graph/badge.svg)](https://codecov.io/gh/conceptho/adonis-service-layer)
[![npm version](https://img.shields.io/npm/v/@conceptho/adonis-service-layer.svg?style=flat)](https://npmjs.org/package/@conceptho/adonis-service-layer)
[![CircleCI](https://circleci.com/gh/conceptho/adonis-service-layer.svg?style=svg)](https://circleci.com/gh/conceptho/adonis-service-layer) 

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
