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
