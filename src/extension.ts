// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as cp from 'child_process';
import * as path from 'path';

//function buildCommands(context: vscode.ExtensionContext): void;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext): void {

	// all the regular commands
	buildCommands(context);

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "cc65-redux" is now active!');
}

//declare function buildProgramCL65(void): number;
//declare function buildProgramMake(void): number;
//declare function runProgram(void): void;

function buildCommands(context: vscode.ExtensionContext): void {
    //  define the build and run command
    let commandBuildRun = vscode.commands.registerCommand('cc65.build_run', function () {

        if (buildProgramCL65() === 0) {

            runProgram();
        }
    });

    //  define the build command
    let commandBuild = vscode.commands.registerCommand('cc65.build', function () {

        buildProgramCL65();
    });

    //  define the build and run command
    let commandBuildRunMake = vscode.commands.registerCommand('cc65.make.build_run', function () {

        if (buildProgramMake() === 0) {

            runProgram();
        }
    });

    //  define the build command
    let commandBuildMake = vscode.commands.registerCommand('cc65.make.build', function () {

        buildProgramMake();
	});
	
	let commandRun = vscode.commands.registerCommand('cc65.run.program', function () {
		// this should run the program in the emulator
		runProgram();
    });
    
    let commandRunEmu = vscode.commands.registerCommand('cc65.run.emulator', function () {
		// this should just launch the emulator
		launchEmulator(false);
    });

    let commandTest = vscode.commands.registerCommand('cc65.test', function () {
        // show something
        vscode.window.showInformationMessage('cc65 test command to activate from the command palette');
    });

    context.subscriptions.push(commandBuild);
    context.subscriptions.push(commandBuildRun);
    context.subscriptions.push(commandBuildMake);
    context.subscriptions.push(commandBuildRunMake);
    context.subscriptions.push(commandRun);
    context.subscriptions.push(commandTest);
}

function getOneConfig(key: string, defaultVal: string, outChannel?: vscode.OutputChannel): string {
    let wsConfig = vscode.workspace.getConfiguration('cc65');
    let v: string = wsConfig.get(key, defaultVal);
    if (outChannel) {
        outChannel.append("\t");
        outChannel.append(key);
        outChannel.append(" = ");
        outChannel.appendLine(v);
    }

	return v;
}

function getOneBooleanConfig(key: string, defaultVal: boolean, outChannel?: vscode.OutputChannel): boolean {
    let wsConfig = vscode.workspace.getConfiguration('cc65');
    let v: boolean = wsConfig.get(key, defaultVal);
    if (outChannel) {
        outChannel.append("\t");
        outChannel.append(key);
        outChannel.append(" = ");
        outChannel.appendLine(v.toString());
    }

	return v;
}

function getCC65Path(outChannel?: vscode.OutputChannel) : string {
    return getOneConfig('compilerToolsPath', "C:\\cc65\\bin", outChannel || undefined);
}

function getCC65Config(outChannel?: vscode.OutputChannel) : string {
    return getOneConfig('cl65.config', "C:\\cc65\\cfg\\atarixl.cfg", outChannel || undefined);
}

function getCC65Options(outChannel?: vscode.OutputChannel) : string {
    return getOneConfig('cc65.options', "", outChannel || undefined);
}

function getCC65CreateDebugInfo(outChannel?: vscode.OutputChannel) : boolean {
    return getOneBooleanConfig('createDebugInfo', true, outChannel || undefined);
}

function getCC65Target(outChannel?: vscode.OutputChannel) : string {
    return getOneConfig('cl65.target', "atarixl", outChannel || undefined);
}

function getCC65Extension(outChannel?: vscode.OutputChannel) : string {
    return getOneConfig('cl65.extension', "xex", outChannel || undefined);
}

function getCC65BuildOutput(outChannel?: vscode.OutputChannel) : string {
    return getOneConfig('env.buildOutput', "build", outChannel || undefined);
}

function getCC65BuildEnv(outChannel?: vscode.OutputChannel) : string {
    return getOneConfig('env.build', "windows", outChannel || undefined);
}

function getCC65VSCodeEnv(outChannel?: vscode.OutputChannel) : string {
    return getOneConfig('env.vscode', "windows", outChannel || undefined);
}

function getCC65TestEnv(outChannel?: vscode.OutputChannel) : string {
    return getOneConfig('env.test', "windows", outChannel || undefined);
}

function getCC65EmulatorPrelaunch(outChannel?: vscode.OutputChannel) : string {
    return getOneConfig('emulator.prelaunch', "", outChannel || undefined);
}

function getCC65EmulatorPath(outChannel?: vscode.OutputChannel) : string {
    return getOneConfig('emulator.path', "", outChannel || undefined);
}

function getCC65EmulatorOptions(outChannel?: vscode.OutputChannel) : string {
    return getOneConfig('emulator.options', "", outChannel || undefined);
}

function getCC65EmulatorQuickConfig(outChannel?: vscode.OutputChannel) : string {
    return getOneConfig('emulator.quickConfig', "", outChannel || undefined);
}

function getProgramName() : string {
	// will be based off of the workspace name
	// what if we are not in a workspace?
    var programName: string = vscode.workspace.name!;

	let programNames: string[] = programName.split(" ");
    programName = programNames[0];
    
    return programName;
}

function dumpConfig(outChannel: vscode.OutputChannel) {
    let configuration = vscode.workspace.getConfiguration('cc65');

    outChannel.appendLine("BEGIN cc65 configuration BEGIN");
    
    // seems no way to do this automatically, super annoying
    getCC65Path(outChannel);
    getCC65Config(outChannel);
    getCC65Options(outChannel);
    getCC65CreateDebugInfo(outChannel);
    getCC65Target(outChannel);
    getCC65Extension(outChannel);
    getCC65BuildOutput(outChannel);
    getCC65BuildEnv(outChannel);
    getCC65VSCodeEnv(outChannel);
    getCC65TestEnv(outChannel);
    getCC65EmulatorPrelaunch(outChannel);
    getCC65EmulatorOptions(outChannel);
    getCC65EmulatorQuickConfig(outChannel);

    outChannel.appendLine("END  cc65 configuration   END");
}


// build the program
function buildProgramCL65() {

    let errorCode = 0;

    // Check path settings
    let outputChannel = vscode.window.createOutputChannel('cl65 Build');
    outputChannel.clear();
    outputChannel.show();
    dumpConfig(outputChannel);

    let cc65Path: string = getCC65Path();
    let config: string = getCC65Config();
    let cc65Options: string = getCC65Options();
    let target: string = getCC65Target();
    let targetExtension: string = getCC65Extension();
    let buildenv: string = getCC65BuildEnv();
    let vscodeenv: string = getCC65VSCodeEnv();
    let buildDir: string = getCC65BuildOutput();

    let createDebugInfo: boolean = getCC65CreateDebugInfo();

    if (targetExtension === "target") {
        targetExtension = target;
    }

	// will be based off of the workspace name
    // what if we are not in a workspace?
    let programName: string = getProgramName();

    if (cc65Path === "") {
		vscode.window.showErrorMessage('Set cc65 in User Settings.');
		errorCode = -1;
        return errorCode;
	}
	
	if (!fs.existsSync(cc65Path)) {
        vscode.window.showErrorMessage('cc65 path not found. Check User Settings.');
		errorCode = -2;
        return errorCode;
	}

    let toolExtension: string = "";
    let fileseparator: string = "/";
    let altRootPath: string = vscode.workspace.workspaceFolders![0].uri.fsPath.trim();
    let rootpath: string = vscode.workspace.rootPath!.trim();

    if (altRootPath === rootpath) {
        outputChannel.appendLine("The paths are the same");
    }


    if (buildenv === "linux") {
        rootpath = rootpath.replace("c:", "/mnt/c");
        rootpath = rootpath.replace("d:", "/mnt/d");
        rootpath = rootpath.replace("e:", "/mnt/e");
        rootpath = rootpath.replace("f:", "/mnt/f");
        rootpath = rootpath.replace("g:", "/mnt/g");
        rootpath = rootpath.replace("h:", "/mnt/h");
        rootpath = rootpath.replace("i:", "/mnt/i");
        rootpath = rootpath.replace("j:", "/mnt/j");

        while (rootpath.indexOf("\\") > -1) {
            rootpath = rootpath.replace("\\", "/");
        }
    } else {
        fileseparator = "\\";
        toolExtension = ".exe";
    }

    let command = "powershell.exe";
    let scriptExt = '.sh';

    if (buildenv === "linux" && vscodeenv === "linux") {
        command = "bash";
    } else if (buildenv === "linux" && vscodeenv === "windows") {
        command = "powershell.exe";
	} else if (buildenv === "windows" && vscodeenv === "windows") {
		command = "powershell.exe";
	} else 	{
        vscode.window.showErrorMessage('cc65 build env misconfigured. Check User Settings.');
		errorCode = -3;
        return errorCode;
    }
    
    // temp - only support windows/windows
    if (buildenv !== "windows" || vscodeenv !== "windows") {
        vscode.window.showErrorMessage('cc65 Only windows for buildenv and vscodeenv is supported right now. Check User Settings.');
		errorCode = -4;
        return errorCode;
    }

    if (buildenv === "windows") {
        scriptExt = ".bat";
    }

	outputChannel.append("Building using buildenv: ");
	outputChannel.append(buildenv);
	outputChannel.append(" vscodenv: ");
	outputChannel.append(vscodeenv);
	outputChannel.appendLine("...");

    var filename = vscode.workspace.rootPath!.trim() + "/cc65_plugin_build" + scriptExt;
    if (buildenv === "windows") { 
        fs.writeFileSync(filename, ":: CC65 Batch file for building\n");
    }
    else {
        fs.writeFileSync(filename, "#!/bin/bash\n");
    }

    var files = [];
    var objectFilesSet: Set<string> = new Set<string>();

    let parameters:string[] = [];
    if(command === "powershell.exe") {
        parameters = [
            "\"",
            "./cc65_plugin_build.bat\""
        ];
	} else {
        parameters = [
            "-c",
            "./cc65_plugin_build.sh"
        ];
    }

    // This might be better to be a task instead of like this...
	vscode.workspace.findFiles("src/**/*.c", "", 1000)
        .then(
        (result) => {
            files = result;
            fs.appendFileSync(filename, "cd " + rootpath + "\n");
            for (var index in files) {
                var oneFile = files[index].path.substring(files[index].path.indexOf("src/"));

                fs.appendFileSync(filename,
                    cc65Path + fileseparator + "cc65" + toolExtension +
                    " -verbose" +
                    (createDebugInfo ? " -g " : "") +
                    " -t " + target +
                    " " + cc65Options +
                    " " + oneFile +"\n", "utf8");
    
                    fs.appendFileSync(filename,
                    cc65Path + fileseparator + "ca65" + toolExtension +
                    " -verbose" +
                    (createDebugInfo ? " -g " : "") +
                    " " + oneFile.replace(".c",".s") +"\n", "utf8" );
                    
                    objectFilesSet.add(oneFile.replace(".c", ".o"));
             }
        },
        (reason) => {
            console.log(reason);
        }
        ).then(() => {
            vscode.workspace.findFiles("src/**/*.s", "", 1000).then(
                (result) => {
            files = result;

            for (var index in files) {
                var oneFile = files[index].path.substring(files[index].path.indexOf("src/"));

                fs.appendFileSync(filename,
                cc65Path + fileseparator + "ca65" + toolExtension +
                " -verbose" +
                (createDebugInfo ? " -g " : "") +
                " -t " + target +
                " " + oneFile +"\n", "utf8");

                objectFilesSet.add(oneFile.replace(".s", ".o"));
             }
        },
        (reason) => {
            console.log(reason);
        }
        ).then(() => {

            var objectFiles: string[] = [];

            for (let s of objectFilesSet) {
                objectFiles.push(s);
            }

            var allObjectFiles = objectFiles.join(' ');

            // to consider - adding an output/build dir

            outputChannel.append('' + config);
            fs.appendFileSync(filename,
                cc65Path + fileseparator + "ld65" + toolExtension +
                (config ? " -C " + config : " -t " + target) +
                (createDebugInfo ? " -Ln " + programName + "." + targetExtension + ".lbl" : "") +
                (createDebugInfo ? " --dbgfile " + programName + "." + targetExtension + ".dbg" : "") +
                " -o " + programName + "." + targetExtension +
                " " + allObjectFiles +
                " " + cc65Path + fileseparator + ".." + fileseparator + "lib" + fileseparator + target + ".lib"
            );
		});
		
		outputChannel.appendLine("running command...");
		outputChannel.append(command);
		outputChannel.append(" ");
		outputChannel.append(parameters.join(" "));
		outputChannel.appendLine("...");

		// this runs the command
        let ca = cp.spawn(command, parameters, {
            detached: false,
            shell: true,
            cwd: vscode.workspace.rootPath!.trim()
        });

        ca.on("close", (e) => {
            outputChannel.appendLine('Child process exit code: ' + e);
			errorCode = e;
			// add config for this
            if (errorCode !== 0) {
                vscode.window.showErrorMessage('Compilation failed with errors.');
            }
        });

        ca.stdout.on('data', function (data) {
            outputChannel.append('' + data);
        });

        ca.stderr.on('data', function (data) {
            outputChannel.append('' + data);
		});
		
		outputChannel.appendLine("... finished.");
    });

    return errorCode;
}


/**
 *  Build the Program with the Make
 */
function buildProgramMake() {

    let nyi:boolean = true;
    if (nyi) {
        vscode.window.showErrorMessage('makefile building not yet supported');
        return;
    }


    let errorCode = 0;

    let outputChannel = vscode.window.createOutputChannel('cc65 Build (make)');
    outputChannel.clear();
    outputChannel.show();
    dumpConfig(outputChannel);

    // Check path settings
    let target = getCC65Target();
    let buildenv = getCC65BuildEnv();
    let vscodeenv = getCC65VSCodeEnv();

    let command = "powershell.exe";

    if (buildenv === "linux" && vscodeenv === "linux") {
        command = "bash";
    } else if (buildenv === "linux" && vscodeenv === "windows") {
        command = "wsl";
	}

	outputChannel.append("Making using buildenv: ");
	outputChannel.append(buildenv);
	outputChannel.append(" vscodenv: ");
	outputChannel.append(vscodeenv);
	outputChannel.append(" target: ");
	outputChannel.append(target);
	outputChannel.appendLine("...");

    let make = cp.spawn(command, [
        "make",
        "T=" + target
    ], {
            detached: false,
            shell: true,
            cwd: vscode.workspace.rootPath!.trim()
        });

    make.on('close', function (e) {
        outputChannel.appendLine('Child process exit code: ' + e);
        errorCode = e;
        if (e !== 0) {
            vscode.window.showErrorMessage('Compilation failed with errors.');
        }
    });

    make.stdout.on('data', function (data) {
        outputChannel.append('' + data);
    });

    make.stderr.on('data', function (data) {
        outputChannel.append('' + data);
    });

    return errorCode;

    
}

function launchEmulator(launchProgram:boolean) {


    let emulatorOptions = getCC65EmulatorOptions();
    let testenv = getCC65TestEnv();
    let vscodeenv = getCC65VSCodeEnv();
    let quickConfig = getCC65EmulatorQuickConfig();
    let programName: string = getProgramName();
    let targetExtension: string = getCC65Extension();
    let target: string = getCC65Target();

    let emulatorPath:string = getCC65EmulatorPath();

    if (!emulatorPath) {
        vscode.window.showErrorMessage('cc65 emulator path not set. Check User Settings.');
        return;
    }

	if (!fs.existsSync(emulatorPath)) {
        vscode.window.showErrorMessage('cc65 emulator not found. Check User Settings.');
        return;
	}

    let emulatorName:string = path.basename(emulatorPath, path.extname(emulatorPath));

	let outputChannel = vscode.window.createOutputChannel(emulatorName);
    outputChannel.clear();
    outputChannel.show();
    //dumpConfig(outputChannel);

    let altRootPath: string = vscode.workspace.workspaceFolders![0].uri.fsPath.trim();
    let rootpath: string = vscode.workspace.rootPath!.trim();

    if (altRootPath === rootpath) {
        outputChannel.appendLine("The paths are the same");
    }

    var shell = "powershell.exe";

    if (testenv === "linux" && vscodeenv === "linux") {
        shell = "bash";
    } else if (testenv === "linux" && vscodeenv === "windows") {
        shell = "wsl";
    } else if (testenv === "windows" && vscodeenv === "windows") {
        shell = "powershell.exe";
    } else 	{
        vscode.window.showErrorMessage('cc65 test env misconfigured. Check User Settings.');
        return;
    }

    if (quickConfig === "altirra") { 
        let finalEmulatorOptions: string = "/debug /singleinstance "; 

/*                
        if (target === 'atari') {
            finalEmulatorOptions += " /defprofile:800 ";
        } else if (target === 'atarixl') {
            finalEmulatorOptions += " /defprofile:xl ";
        }
*/
        finalEmulatorOptions += " /autoprofile ";

        finalEmulatorOptions += " " + emulatorOptions;

        if (launchProgram) {
            finalEmulatorOptions += " /run " + programName + "." + targetExtension;
        }
        emulatorOptions = emulatorPath + " " + finalEmulatorOptions;
    } else if (quickConfig === "VICE") {
        vscode.window.showErrorMessage('cc65 VICE not supported via quick config yet. Check User Settings.');
        return;
    } else {
        // if not quick config, then just do the simple thing
        emulatorOptions = emulatorPath + " " + emulatorOptions;
    }
    
    let params = emulatorOptions.split(" ");

    let emulator = cp.spawn(shell, params, {
        //shell: shell,
        detached: false,
        cwd: rootpath
    });

    emulator.on('close', function (e) {
        outputChannel.appendLine('Child process exit code: ' + e);
        if (e !== 0) {
            vscode.window.showErrorMessage('Emulation failed with errors.');
        }
    });

    emulator.stdout.on('data', function (data) {
        outputChannel.append('' + data);
    });

    emulator.stderr.on('data', function (data) {
        outputChannel.append('' + data);
    });

    emulator.unref();
}

// run the emulator
function runProgram() {

	// change this to be configurable, but for now use Altirra
	let outputChannel = vscode.window.createOutputChannel('Altirra');
    outputChannel.clear();
    outputChannel.show();
    dumpConfig(outputChannel);

    let testenv = getCC65TestEnv();
    let vscodeenv = getCC65VSCodeEnv();
    let emulatorPrelaunch = getCC65EmulatorPrelaunch();
	
	// do we actually need this?
    if (emulatorPrelaunch) {
        var prelaunchParameters = emulatorPrelaunch.split(" ");
        var shell = "powershell.exe";

        if (testenv === "linux" && vscodeenv === "linux") {
            shell = "bash";
        } else if (testenv === "linux" && vscodeenv === "windows") {
            shell = "wsl";
        }

        let prelaunch = cp.spawn(shell, prelaunchParameters, {
            detached: false,
            //shell: shell,
            cwd: vscode.workspace.rootPath!.trim()
        });

        prelaunch.on('close', function (e) {
            outputChannel.appendLine('Child process exit code: ' + e);
            if (e !== 0) {
                vscode.window.showErrorMessage('Prelaunch failed with errors.');
            } else {
                launchEmulator(true);
            }
        });

        prelaunch.stdout.on('data', function (data) {
            outputChannel.append('' + data);
        });

        prelaunch.stderr.on('data', function (data) {
            outputChannel.append('' + data);
        });

        prelaunch.unref();
    } else {
		// launch it
        launchEmulator(true);
    }

}

// this method is called when your extension is deactivated
export function deactivate(context: vscode.ExtensionContext) {
	// shouldn't we unregister?
	// how do we remove our commands
}
