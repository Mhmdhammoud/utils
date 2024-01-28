declare class ImageFull {
    /**
     * @remarks
     *  Receives either a className or an id or an element and returns a promise that resolves when all images are loaded
     * @param selector - either a className or an id or an element that contains images
     * @example
     * ```ts
     * .image-container
     * #image-container
     * img //as an element
     *
     * Imagefull.preloadImages('.image-container').then((event) => {
     *  do something
     * })
     * ```
     *
     * @returns Promise<ImagesLoaded | undefined>
     *
     */
    preloadImages: (selector: string) => Promise<unknown>;
}
declare const imagefull: ImageFull;
export default imagefull;
