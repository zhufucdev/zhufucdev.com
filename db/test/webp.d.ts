declare module 'webp-converter' {
  declare var main: {
    grant_permissions(),
    buffer2webpbuffer(input: Buffer, format: string, options: string): Promise<Buffer>
  }
  export default main
}