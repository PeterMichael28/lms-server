class ErrorHandler extends Error {

    code: number
    constructor( message:any, code: number ) {
        super( message );
        this.code = code

        Error.captureStackTrace(this, this.constructor)
    }
}


export default ErrorHandler