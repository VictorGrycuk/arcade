import { join, parse } from 'path'
import { getInput, setResult, TaskResult } from 'azure-pipelines-task-lib';
import { execSync } from "child_process";
import { existsSync } from 'fs';

const run = (): void => {
    // Create ApiCompat path
    const ApiCompatPath = join(__dirname, 'ApiCompat', 'Microsoft.DotNet.ApiCompat.exe');
    
    // Show the ApiCompat version
    console.log(execSync(`"${ ApiCompatPath }" --version`).toString());
    
    // Get the binaries to compare and create the command to run
    const inputFiles: string = getInputFiles();
    const command = `"${ApiCompatPath}" "${inputFiles}" --impl-dirs "${getInput('implFolder')}" ${getOptions()}`;

    // Run the ApiCompat command
    console.log(command);
    runCommand(command);
}

const getInputFiles = (): string => {
    const filesName: string[] = [];

    getInput('contractsFileName').split(' ').forEach(file => {
        const fullFilePath: string = join(getInput('contractsRootFolder'), file);
        if (existsSync(fullFilePath)) {
            filesName.push(fullFilePath);
        }
    });

    return filesName.join(',');
}

const runCommand = (command: string): void => {
    const result = execSync(command).toString();
    const issuesCount: number = getTotalIssues(result, result.indexOf("Total Issues"));
    const body: string = getBody(result, result.indexOf("Total Issues"));
    const compatResult: TaskResult = getCompattibilityResult(issuesCount);
    const colorCode: string = getColorCode(issuesCount);
    const resultText = issuesCount != 0 ?
        `There were ${ issuesCount } differences between the assemblies` :
        `No differences were found between the assemblies` ;
    
    console.log(body + colorCode + 'Total Issues : ' + issuesCount);
    setResult(compatResult, resultText);
}

const getOptions = (): string => {
    var command = getInput('resolveFx') === 'true' ? ' --resolve-fx' : '';
    command += getInput('warnOnIncorrectVersion') === 'true' ? ' --warn-on-incorrect-version' : '';
    command += getInput('warnOnMissingAssemblies') === 'true' ? ' --warn-on-missing-assemblies' : '';

    return command;
}

const getCompattibilityResult = (totalIssues: number): TaskResult => {
    return totalIssues === 0
        ? TaskResult.Succeeded
        : getInput('failOnIssue') === 'true'
            ? TaskResult.Failed
            : TaskResult.SucceededWithIssues;
}

const getColorCode = (totalIssues: number): string => {
    return totalIssues === 0
        ? "\x1b[32m"
        : getInput('failOnIssue') === 'true'
            ? "\x1b[31m"
            : "\x1b[33m";
}

const getTotalIssues = (message: string, indexOfResult: number): number => {
    return parseInt(message.substring(indexOfResult).split(':')[1].trim(), 10);
}

const getBody = (message: string, indexOfResult: number): string => {
    return message.substring(0, indexOfResult - 1);
}

run();
