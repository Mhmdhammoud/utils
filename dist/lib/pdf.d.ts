declare class Pdf {
    /**
     * @remarks Convert image links into base64 format
     * @param url - The image url
     * @returns string
     * @example
     * ```typescript
     * pdf.getBase64Images('https://fastly.picsum.photos/id/15/200/300.jpg?hmac=lozQletmrLG9PGBV1hTM1PnmvHxKEU0lAZWu8F2oL30')
     * // => 'Hello-World'
     * ```
     * */
    getBase64Images: (url: string) => string;
}
declare const pdf: Pdf;
export default pdf;
