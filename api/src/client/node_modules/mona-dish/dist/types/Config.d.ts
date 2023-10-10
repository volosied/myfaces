import { IValueHolder, Optional } from "./Monad";
export declare const CONFIG_VALUE = "__END_POINT__";
export declare const CONFIG_ANY = "__ANY_POINT__";
export type ConfigDef = {
    [key: string]: any;
};
/**
 * Config, basically an optional wrapper for a json structure
 * (not Side - effect free, since we can alter the internal config state
 * without generating a new config), not sure if we should make it side - effect free
 * since this would swallow a lot of performance and ram
 */
export declare class Config extends Optional<any> {
    private configDef?;
    constructor(root: any, configDef?: ConfigDef);
    /**
     * shallow copy getter, copies only the first level, references the deeper nodes
     * in a shared manner
     */
    get shallowCopy(): Config;
    protected shallowCopy$(): Config;
    /**
     * deep copy, copies all config nodes
     */
    get deepCopy(): Config;
    protected deepCopy$(): Config;
    /**
     * creates a config from an initial value or null
     * @param value
     */
    static fromNullable<T>(value?: T | null): Config;
    /**
     * simple merge for the root configs
     */
    shallowMerge(other: Config, overwrite?: boolean, withAppend?: boolean): void;
    /**
     * assigns a single value as array, or appends it
     * to an existing value mapping a single value to array
     *
     *
     * usage myConfig.append("foobaz").value = "newValue"
     *       myConfig.append("foobaz").value = "newValue2"
     *
     * resulting in myConfig.foobaz == ["newValue, newValue2"]
     *
     * @param {string[]} accessPath
     */
    append(...accessPath: string[]): IValueHolder<any>;
    /**
     * appends to an existing entry (or extends into an array and appends)
     * if the condition is met
     * @param {boolean} condition
     * @param {string[]} accessPath
     */
    appendIf(condition: boolean, ...accessPath: string[]): IValueHolder<any>;
    /**
     * assigns a new value on the given access path
     * @param accessPath
     */
    assign(...accessPath: any[]): IValueHolder<any>;
    /**
     * assign a value if the condition is set to true, otherwise skip it
     *
     * @param condition the condition, the access accessPath into the config
     * @param accessPath
     */
    assignIf(condition: boolean, ...accessPath: Array<any>): IValueHolder<any>;
    /**
     * get if the access path is present (get is reserved as getter with a default, on the current path)
     * TODO will be renamed to something more meaningful and deprecated, the name is ambiguous
     * @param accessPath the access path
     */
    getIf(...accessPath: Array<string>): Config;
    /**
     * gets the current node and if none is present returns a config with a default value
     * @param defaultVal
     */
    get(defaultVal: any): Config;
    delete(key: string): Config;
    /**
     * converts the entire config into a json object
     */
    toJson(): any;
    protected getClass(): any;
    private setVal;
    /**
     * asserts the access path for a semi typed access
     * @param accessPath
     * @private
     */
    private assertAccessPath;
    private isNoArray;
    private isArray;
}
