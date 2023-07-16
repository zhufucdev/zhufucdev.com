export class CommentUtil {
    static maxLength = 300;
    static checkLength(body: string): number {
        return body.trim().length;
    }
    static validBody(text: string): boolean {
        return text.length > 0 && this.checkLength(text) <= this.maxLength;
    }
}
