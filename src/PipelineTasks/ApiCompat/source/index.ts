import { configuration } from "./configuration";
import { Core } from "./core";
import { join } from 'path'

run();

function run(): void {
    const config = new configuration();
    const core: Core = new Core(config);
    
    // Get the binaries to compare
    const inputFiles: string[] = core.getInputFiles();
    
    // get binary to compare to
    core.downloadNuget(config.parameters.nugetPackageName.value, config.parameters.packageSubFolder.value).then(() => {
        //const placeholder: string = config.parameters.packageSubFolder.value;
        const placeholder: string = join(__dirname, config.parameters.nugetPackageName.value);
    
        // run ApiCompat
        console.log(`"${config.ApiCompatPath}" "${inputFiles.join(',')}" --impl-dirs "${placeholder}"`);
        const result: string = core.runPlain(`"${config.ApiCompatPath}" "${inputFiles.join(',')}" --impl-dirs "${placeholder}"`);
        console.log(result);
    });
}
