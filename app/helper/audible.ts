export class AudibleHelper {
  /**
   * 000-0000000-0000000
   */
  static generateRandomSessionId(): string {
    const randomDigits = () =>
      Math.floor(Math.random() * 10 ** 7)
        .toString()
        .padStart(7, '0')
    return `000-${randomDigits()}-${randomDigits()}`
  }
}
