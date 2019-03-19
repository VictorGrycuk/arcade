import { configuration } from "./configuration";
import { Core } from "./core";
import tl from 'azure-pipelines-task-lib';

run();

function run(): void {
    const config = new configuration();
    const core: Core = new Core(config);
    
    // Get the binaries to compare
    const inputFiles: string[] = core.getInputFiles();
    
    //const placeholder: string = config.parameters.packageSubFolder.value;
    //const placeholder: string = join(__dirname, config.parameters.nugetPackageName.value);
    
    // run ApiCompat
    //console.log(`"${config.ApiCompatPath}" "${inputFiles.join(',')}" --impl-dirs "${placeholder}"`);
    core.runWithCustomError(`"${config.ApiCompatPath}" "${inputFiles.join(',')}" --impl-dirs "${ tl.getInput('implFolder') }"`);
}
