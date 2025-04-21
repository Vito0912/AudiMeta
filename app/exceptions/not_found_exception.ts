import { Exception } from '@adonisjs/core/exceptions'

export default class NotFoundException extends Exception {
  static status = 404
  static message =
    'The requested resource was not found with your request parameters. Please make sure you are using the correct region'
  static code = 'E_NOT_FOUND'
}
