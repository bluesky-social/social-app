export interface Main {
    images: Image[];
    [k: string]: unknown;
}
export interface Image {
    image: {
        cid: string;
        mimeType: string;
        [k: string]: unknown;
    };
    alt: string;
    [k: string]: unknown;
}
export interface Presented {
    images: PresentedImage[];
    [k: string]: unknown;
}
export interface PresentedImage {
    thumb: string;
    fullsize: string;
    alt: string;
    [k: string]: unknown;
}
