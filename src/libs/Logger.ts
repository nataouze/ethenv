export default class Logger {
    protected _log: boolean;
    constructor() {
        this._log = (
            process.env["ETHENV_DEBUG"] === "true" ||
            process.env["REACT_APP_ETHENV_DEBUG"] === "true"
        );
    }

    log(message?: any, ...optionalParams: any[]): void {
        if (this._log) {
            console.log(message, ...optionalParams);
        }
    }
}
