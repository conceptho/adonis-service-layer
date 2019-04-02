# CHANGELOG

## 1.0.0 - April 2, 2019

- Library:
  - Enforced Standard code style
  - Switched to dependency injection approach

- Interface:
  - Exceptions:
    - Renamed `ErrorCodeException` to `HttpCodeException`.
    - Added `ServiceException` and `ValidationException`.
  - Models:
    - Added the following methods on `Model`:
      - `sanitizeRules()`: Model now sanitize data before saves based on this config.
      - `validationMessages()`: Consume this as validation messages formatter.
      - `validate()`: Validates the model instance. Consume the methods above and returns an object `{ error: ValidationError, messages: Array }`.
  - Services:
    - Every basic method (find, findOrCreate, update, create, delete and undelete) returns a `ServiceResponse`. A `ServiceResponse` is an object `{ error: Error, data: any }`.
    -  `Service` does not provide method `validateModelData()` anymore. It uses the `validate()` method on the model instance instead.