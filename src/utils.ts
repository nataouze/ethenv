export async function buildConfig<T>(configs: (T | string)[]): Promise<T> {
    return Promise.all<T>(
        configs.map(
            (config: T | string): Promise<T> => {
                if (typeof config === 'string') {
                    console.log(`fetching ${typeof config} config from ${config}`);
                    return fetch(config as string)
                        .then((response: Response) => response.json())
                        .then((json: any) => json as T)
                        .catch((e: any) => {
                            console.error(`error loading ${typeof config} config from ${config}`, e);
                            return ({} as unknown) as T;
                        });
                } else {
                    return Promise.resolve(config);
                }
            }
        )
    ).then((retrievedConfigs: T[]) => {
        const config = retrievedConfigs.reduce((prev: T, curr: T) => ({ ...prev, ...curr }));
        // console.log(config);
        return config;
    });
}
