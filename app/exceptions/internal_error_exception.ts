import { Exception } from '@adonisjs/core/exceptions'

export default class InternalErrorException extends Exception {
  static status = 500
}
