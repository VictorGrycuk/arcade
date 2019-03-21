import { join } from 'path'
import { getInput, setResult, TaskResult } from 'azure-pipelines-task-lib';
import { execSync } from "child_process";
import { existsSync } from 'fs';
import CommandLineResult from './commandLineResult';

run();

function run(): void {
    // Create ApiCompat path
    const ApiCompatPath = join(__dirname, 'ApiCompat', 'Microsoft.DotNet.ApiCompat.exe');
    
    // Show the ApiCompat version
    console.log(execSync(`"${ApiCompatPath}" --version`).toString());
    
    // Get the binaries to compare and create the command to run
    const inputFiles: string = getInputFiles();
    const command = `"${ApiCompatPath}" "${inputFiles}" --impl-dirs "${getInput('implFolder')}"`;

    // Run the ApiCompat command
    if (getInput('failOnIssue') === 'true') {
        runWithError(command);
    } else {
        runWithWarning(command);
    }
}

function getInputFiles(): string {
    const filesName: string[] = [];

    getInput('contractsFileName').split(' ').forEach(file => {
        const fullFilePath: string = join(getInput('contractsRootFolder'), file);
        if (existsSync(fullFilePath)) {
            filesName.push(fullFilePath);
        }
    });

    return filesName.join(',');
}

function runWithWarning(command: string): void {
    let result = parseResult(execSync(command).toString());
    if (result.totalIssues > 0) {
            console.log(result.body);
            console.log("\x1b[33m", "Total Issues : " + result.totalIssues);
            setResult(TaskResult.SucceededWithIssues, `There were ${ result.totalIssues } differences between the assemblies`);
    } else {
        console.log(result.body);
        console.log("\x1b[32m", "Total Issues : " +  result.totalIssues);
        setResult(TaskResult.Succeeded, `There were no differences between the assemblies`);
    }
}

function runWithError(command: string): void {
    let result: CommandLineResult;

    command = addOptions(command);
    try {
        result = parseResult(execSync(command).toString());

        if (result.totalIssues > 0) {
            console.log(result.body);
            console.log("\x1b[31m", "Total Issues : " + result.totalIssues);
            setResult(TaskResult.Failed, `There were ${result} differences between the assemblies`);
        } else {
            console.log(result.body);
            console.log("\x1b[32m", "Total Issues : " +  result.totalIssues);
            setResult(TaskResult.Succeeded, `There were no differences between the assemblies`);
        }
    } catch (error) {
        setResult(TaskResult.Failed, `A problem ocurred: ${error.message}`);
    }
}

function addOptions(command: string): string {
    command += getInput('resolveFx') ? ' --resolve-fx' : '';
    command += getInput('warnOnIncorrectVersion') ? ' --warn-on-incorrect-version' : '';
    command += getInput('warnOnMissingAssemblies') ? ' --warn-on-missing-assemblies' : '';

    return command;
}

function parseResult(message: string): CommandLineResult {
    const indexOfResult: number = message.indexOf("Total Issues");
    return new CommandLineResult(message.substring(0, indexOfResult - 1),
    message.substring(indexOfResult));
}