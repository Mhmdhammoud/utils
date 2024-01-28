import imagesLoaded from 'imagesloaded'
/*
	 Author : Mustafa Halabi https://github.com/mustafahalabi
	 Date : 2024-01-29
	 Description : Loads images and returns a promise
	 Version : 1.0
*/
class ImageFull {
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
	preloadImages = (selector: string) => {
		return new Promise((resolve) => {
			imagesLoaded(
				document.querySelectorAll(selector),
				{background: true},
				(event) => {
					resolve(event)
				}
			)
		})
	}
}

const imagefull = new ImageFull()
export default imagefull
