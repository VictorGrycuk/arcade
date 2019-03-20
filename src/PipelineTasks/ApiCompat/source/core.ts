import tl from 'azure-pipelines-task-lib';
import { join } from 'path'
import { existsSync } from 'fs'
import { configuration } from "./configuration";
import { IExecOptions } from 'azure-pipelines-task-lib/toolrunner';
import { execSync } from "child_process";
import { basename } from "path";
import { throws } from 'assert';
const fs = require('fs');
const download = require('download');
const unzip = require('unzip');

export class Core {
    private config: configuration;

    constructor (configuration: configuration) {
        this.config = configuration;
    }

    public getCWD(directory: string): IExecOptions {
        return <IExecOptions> { cwd: tl.getInput(directory) };
    }

    public getArgumentValue(input: string): string {
        return tl.getInput(input);
    }

    public run(command: string, options?: IExecOptions): void{
        const cmd = `${this.config.prefix} ${command}`;
        console.log(`Running command: ${cmd}.`);
        try {
            console.log(execSync(cmd, options).toString());
        }
        catch (error) {
            this.LogError(`A problem ocurred: ${error.message}`);
        }
    }

    public runPlain(command: string): string {
        return execSync(command).toString();
    }

    private parseMessage (message: string) {
        return Number((message.split(':'))[1].trim()) === 0;
    }

    public runWithCustomError(command: string): void{
        command = this.addOptions(command);
        try {
            const result = execSync(command).toString();

            if (this.parseMessage(result)) {
                console.log(result);
            }
            else {
                console.log(result);
                this.LogError(`There were differences between the assemblies`)
            }
        }
        catch (error) {
            this.LogError(`A problem ocurred: ${error.message}`);
        }
    }

    public addOptions(command: string): string{
        const resolveFx = this.config.parameters.resolveFx.value;
        const warnOnIncorrectVersion = this.config.parameters.warnOnIncorrectVersion.value;
        const warnOnMissingAssemblies = this.config.parameters.warnOnMissingAssemblies.value;

        command += resolveFx? ' --resolve-fx' : '';
        command += warnOnIncorrectVersion? ' --warn-on-incorrect-version' : '';
        command += warnOnMissingAssemblies? ' --warn-on-missing-assemblies' : '';

        return command;
    }

    private LogError(message: string): void {
        tl.setResult(tl.TaskResult.Failed, message);
    }

    public paramsBuilder(params: {name: string, value: string}[]): string {
        var fullParams: string[] = [];
        params.forEach(param => {
            if (param.value != null) {
                fullParams.push(`--${param.name} ${param.value}`);
            }
        });

        console.log(fullParams);
        return fullParams.join(' ');
    }

    public getInputFiles(): string[] {
        const filesName: string[] = [];
        this.config.parameters.contractsFileName.value.split(' ').forEach(file => {
            const fullFilePath: string = join(this.config.parameters.contractsRootFolder.value, file);
            if (existsSync(fullFilePath)) {
                filesName.push(fullFilePath);
            }
        });

        return filesName;
    }

    public async downloadNuget (packageName: string, targetFile: string) {
        const version = this.config.parameters.packageVersion != null ? this.config.parameters.packageVersion.value : '';
        const url = `https://www.nuget.org/api/v2/package/${ packageName }/${ version }`
        const dest = join(__dirname, packageName);

        console.log('Downloading the following package: ' + packageName);
        await download(url, dest).then(() =>  {
            const zipPath = join(dest, basename(url));
            this.unzip(zipPath, dest, targetFile);
            fs.unlinkSync(zipPath);
        });
    }
    

    private unzip(zipName: string, dest: string, targetFile: string) {
        fs.createReadStream(zipName)
        .pipe(unzip.Parse())
        .on('entry', function (entry: any) {
            var fileName: string = entry.path;
            //var type = entry.type; // 'Directory' or 'File'
            //var size = entry.size;
            
            if (fileName.endsWith(targetFile)) {
                console.log(`Unzipping ${fileName} to ${dest}`);
                entry.pipe(fs.createWriteStream(join(dest, targetFile)));
            } else {
                entry.autodrain();
            }
        });
    }
}