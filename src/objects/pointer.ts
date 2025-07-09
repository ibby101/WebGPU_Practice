export class Pointer {
    private previousX: number = 0;
    private previousY: number = 0;
    public deltax: number = 0;
    public deltay: number = 0;
    public lmb: number = 1;
    public rmb: number = 2;
    public middlemb: number = 4;

    /// Creates a new Pointer instance.
    constructor() {}
    /**
     * Sets the initial position of the pointer when a pointer event occurs.
     * @param event - The PointerEvent containing the initial position.
     */
    setInitialPosition(event: PointerEvent) {
        this.previousX = event.clientX;
        this.previousY = event.clientY;
        this.deltax = 0;
        this.deltay = 0;
    }

    /**
     * Updates the pointer's delta values based on the current pointer event.
     * If the left mouse button is pressed, it calculates the change in position.
     * Otherwise, it resets the deltas to zero.
     * @param event - The PointerEvent containing the current position.
     */

    update(event: PointerEvent) {
        if (event.buttons === this.middlemb) { // can change this to any button 
            this.deltax = event.clientX - this.previousX;
            this.deltay = event.clientY - this.previousY;

            this.previousX = event.clientX;
            this.previousY = event.clientY;
        } else {
            this.deltax = 0;
            this.deltay = 0;
        }
    }
    /**
     * Returns the current delta values as an object with x and y properties.
     * @returns An object containing the x and y deltas.
     */
    get delta(): { x: number; y: number } {
        return { x: this.deltax, y: this.deltay };
    }
}
