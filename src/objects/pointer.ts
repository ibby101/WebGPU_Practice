export class Pointer {
    private previousX: number = 0;
    private previousY: number = 0;
    public deltax: number = 0;
    public deltay: number = 0;

    constructor() {}

    update (event: PointerEvent) {
        if (event.buttons !== 1) {
            this.previousX = event.clientX;
            this.previousY = event.clientY;
            this.deltax = 0;
            this.deltay = 0;
            return;
        }

        this.deltax = event.clientX - this.previousX;
        this.deltay = event.clientY - this.previousY;

        this.previousX = event.clientX;
        this.previousY = event.clientY;

    }

    get delta(): { x:number, y:number } {
        return { x : this.deltax, y: this.deltay};
    }

}