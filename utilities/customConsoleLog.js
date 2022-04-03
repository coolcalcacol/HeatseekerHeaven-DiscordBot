/**
 * Author: CTN-Originals
 * ◘ is a char that i use isntead of more common chars to avoid errors with collorization
 */
const colors = {
    style: {
        reset: "\x1b[0m",
        bold: "\x1b[1m",
        dim: "\x1b[2m",
        underscore: "\x1b[4m",
        blink: "\x1b[5m",
        inverse: "\x1b[7m",
        hidden: "\x1b[8m",
    },
    fg: {
        black: "\x1b[30m",
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        magenta: "\x1b[35m",
        cyan: "\x1b[36m",
        white: "\x1b[37m",
    },
    bg: {
        black: "\x1b[40m",
        red: "\x1b[41m",
        green: "\x1b[42m",
        yellow: "\x1b[43m",
        blue: "\x1b[44m",
        magenta: "\x1b[45m",
        cyan: "\x1b[46m",
        white: "\x1b[47m",
    },
}
const defaultLogOptions = {
    colorize: true,
    autoColorize: true,
    resetStyle: true,
    newlineMarker: false,
    unfoldJsonObjects: true,
    reformatJsonObjects: true,
    resetLogOptions: true,
    resetForeGroundToColor: true,
    resetForeGroundColor: 'white'
}

module.exports = {
    autoColorizeData: {
        errors: {
            instances: ['undefined', 'null', 'error', 'Error', 'ERROR'],
            fontStyle: 'bold',
            fontColor: 'red',
            bgColor: ''
        },
        statments: {
            instances: [
                'if', 'else', 
                'return', 'break', 'continue', 
                'for', 
                'try', 'catch'
            ],
            fontStyle: 'bold',
            fontColor: 'magenta',
            bgColor: ''
        },

        bools: {
            instances: ['true', 'false'],
            fontStyle: '',
            fontColor: 'blue',
            bgColor: ''
        },
        numbers: {
            instances: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
            fontStyle: '',
            fontColor: 'cyan',
            bgColor: ''
        },
        operatorFlags: {
            instances: [
                'const', 'var', 'let', 
                'typeof', 'this', 
                'function', 'Function', 
                'init', 'Init', 
                'args', 'arg'
            ],
            fontStyle: '',
            fontColor: 'blue',
            bgColor: ''
        },
        operators: {
            instances: ['=', '>', '<', '?', '!', '|', '&', '@'],
            fontStyle: '',
            fontColor: 'cyan',
            bgColor: ''
        },
        symbols: {
            instances: [',', '.', ':', ';'],
            fontStyle: 'bold',
            fontColor: 'yellow',
            bgColor: ''
        },
        syntaxSymbols: {
            instances: ['{', '}', '[', ']', '(', ')'],
            fontStyle: 'bold',
            fontColor: 'green',
            bgColor: ''
        },
        mathSymbols: {
            instances: ['+', '-', '*', '/', '\\', '%', '^', '\"', '\''],
            fontStyle: '',
            fontColor: 'cyan',
            bgColor: ''
        },
    },
    logOptions: {
        colorize: true,
        autoColorize: true,
        resetStyle: true,
        newlineMarker: false,
        unfoldJsonObjects: true,
        reformatJsonObjects: true,
        resetLogOptions: true,
        resetForeGroundToColor: true,
        resetForeGroundColor: 'white'
        // resetColor: true
    },
    
    /**
     * @param {(String|String[]|JSON)} msg The message(s) to log
     * @param {JSON} customOptions The options for the output like colorization
     */
    log(msg, customOptions = this.logOptions) {
        const options = this.logOptions;
        var output = msg;
        if (customOptions != this.logOptions) {
            for (const defailtOptions in this.logOptions) {
                for (const inputOptions in customOptions) {
                    if (inputOptions == defailtOptions) {
                        options[inputOptions] = customOptions[inputOptions];
                    }
                }
            }
        }

        if ((this.isJson(output) || Array.isArray(output)) && options.reformatJsonObjects) {
            const jsonOptions = {
                colorize: true,
                autoColorize: false,
                resetStyle: true,
                newlineMarker: false,
                unfoldJsonObjects: true,
                reformatJsonObjects: true,
                resetLogOptions: true,
                resetForeGroundToColor: true,
                resetForeGroundColor: 'white'
            }
            if (options.unfoldJsonObjects) {
                output = this.formatOutput(this.unfoldNestedObject(output, 2, ' '), jsonOptions);
            }
            else {
                output = this.formatOutput(JSON.stringify(output, 2, ' '), jsonOptions);
            }
		}
        else {
            output = this.formatOutput(output, options);
        }

        console.log(output);
        if (options.resetLogOptions) {
            for (const opt in this.logOptions) {
                this.logOptions[opt] = defaultLogOptions[opt];
            }
        }
    },
    formatOutput(input, options) {
        if (this.isJson(input)) {
            input = JSON.stringify(input);
        }

        if (options.colorize) {
            input = this.colorize(input);
        }
        if (options.autoColorize) {
            input = this.autoColorize(input);
        }
        if (options.newlineMarker) {
            input = this.tryReplaceString(input, '\n', ' ¬\n');
        }
        if (options.resetForeGroundToColor) {
            const reset = this.getStylePlaceholder('style', 'reset');
            const fgColor = this.getStylePlaceholder('fg', options.resetForeGroundColor)
            input = reset + input;
            input = this.tryReplaceString(input, reset, reset + fgColor);
        }

        input = this.setStylePlaceholder(input);
        return input;
    },

    colorize(str) {
        for (const colorType in colors) {
            for (const colorContent in colors[colorType]) {
                const value = this.getStylePlaceholder(colorType, colorContent);
                var strSplit = '';
                try {
                    strSplit = str.split('[' + colorType + '=' + colorContent + ']');
                } catch (error) {}
                
                if (!strSplit) {continue;}
                for (const split in strSplit) {
                    const target = strSplit[split];
                    const segment = target.split('[/>]')[0];
                    str = this.tryReplaceString(str, '[' + colorType + '=' + colorContent + ']' + segment, value + segment, false);
                }
            }
        }
        str = this.tryReplaceString(str, '[/>]', this.getStylePlaceholder('style', 'reset'))
        return str;
    },
    autoColorize(str) {
        for (const colorGroup in this.autoColorizeData) {
            const data = this.autoColorizeData[colorGroup];
            const style = data.fontStyle;
            const fg = data.fontColor;
            const bg = data.bgColor;

            for (let i = 0; i < data.instances.length; i++) {
                const instance = data.instances[i];
                const newInstance = this.getStylePlaceholder('style', style) + 
                this.getStylePlaceholder('fg', fg) + 
                this.getStylePlaceholder('bg', bg) + 
                instance + 
                this.getStylePlaceholder('style', 'reset');

                str = this.tryReplaceString(str, instance, newInstance);
                // console.log(instance + ' -> ' + newInstance)
            }
        }
        return str;
    },

    getStylePlaceholder(type, target) {
        const value = '◘' + type + target + '◘';
        return value;
    },
    setStylePlaceholder(str) {
        for (const colorType in colors) {
            for (const colorContent in colors[colorType]) {
                const value = colors[colorType][colorContent];
                str = this.tryReplaceString(str, '◘' + colorType + colorContent + '◘', value);
            }
        }
        str = this.tryReplaceString(str,'◘style', '')
        str = this.tryReplaceString(str,'◘fg', '')
        str = this.tryReplaceString(str,'◘bg', '')
        str = this.tryReplaceString(str, '◘', '');
        
        return str;
    },

    decolorize(str) {
        for (const colorType in colors) {
            for (const colorContent in colors[colorType]) {
                const value = colors[colorType][colorContent];
                str = this.tryReplaceString(str, value, '');
                str = this.tryReplaceString(str, '[' + colorType + '=' + colorContent + ']', '');
                str = this.tryReplaceString(str, '[/>]', '');
            }
        }
        return str;
    },

    unfoldNestedObject(obj, indent, indentChar, indentInc = 2, parent = true, isJson = true) {
        var output = '';
		var currentIndent = '';
		var currentIndentCount = 0;
		if (parent) {indentInc = indent; indent = 0}
		for (let ind = 0; ind < indent + indentInc; ind++) {
            currentIndent += indentChar;
			currentIndentCount += 1;
		}
        var lineStart = parent ? currentIndent : '\n' + currentIndent;

		for (const key in obj) {
			if (this.isJson(obj[key])) {
				obj[key] = this.unfoldNestedObject(obj[key], currentIndentCount, indentChar, indentInc, false, true);
				output += lineStart + '[style=bold][fg=blue]' + key + '[/>]: {' + obj[key] + '\n' + currentIndent + '}';
			}
			else if (Array.isArray(obj[key])) {
				obj[key] = this.unfoldNestedObject(obj[key], currentIndentCount, indentChar, indentInc, false, false);
				output += lineStart + '[style=bold][fg=blue]' + key + '[/>]: [' + obj[key] + '\n' + currentIndent + ']';
			}
			else {
				if (isJson) {
					output += lineStart + '[style=bold][fg=blue]' + key + '[/>]: [fg=green]' + obj[key] + '[/>]';
				}
				else {
					output += lineStart + '[fg=green]' + obj[key] + '[/>]';
				}
			}
			lineStart = ',\n' + currentIndent
		}
		return parent ? '{\n' + output + '\n}' : output;
    },
    isJson(target) {
		try {
			var o = JSON.parse(JSON.stringify(target));
			if (o && typeof o === "object"  && !Array.isArray(target)) {
				return true;
			}
		}
		catch (e) { }
		return false;
	},

    /**
     * @param {String} input The string to edit
     * @param {String|Char} target The string or char to search for
     * @param {String|Char} replacer The string or char to replace the target with
     * @param {Bool} allInstances Replace all instences?
     * @param {Bool} logError Log any error that is cough in this process?
     */
    tryReplaceString(input, target, replacer, allInstances = true, logError = false) {
        try {
            if (allInstances) {
                input = input.replaceAll(target, replacer);
            }
            else {
                input = input.replace(target, replacer);
            }
        } catch (error) {
            if (logError) {
                console.error(
                    '--Custom Console--\nTRY REPLACE ERROR\n' + 
                    'Input: ' + input + 
                    '\nTarget: ' + target + 
                    '\nReplacer: ' + replacer + 
                    '\n\n' + error
                )
            }
        }
        return input;
    },

    test() {
        this.log(`\n[--------]\nAuto Colerize Test:\nundefined\nnull\ntrue = false\nerror - 404\n[--------]\n`);
        this.log(`\n[--------]\nColerize Test: \n[fg=red]I should be red...[/>] \n[fg=blue]And I Blie![/>] \n[bg=green]I have a Green Background[/>] \n[style=bold]I am strong![/>] \n[style=underscore][style=bold][fg=cyan][bg=magenta]I am all of thos things![/>] \n[--------]\n`, {autoColorize: false});
        const msgArray = [
            'Something to say',
            'but there is a twist...\\/\\',
            'This is an array of messages!',
            'This could come in handy for logging jsons or array elements...!?'
        ]
        this.log(msgArray);
        const data = {
			name: 'opt name',
			desciption: 'some description',
			arr: [
				'apples',
				'banana',
				'orange',
				'barry'
			],
			info: {
				first: 'jhon',
				last: 'baker',
				gender: 'other',
				job: 'chef',
				xArr: [
					{a: '1', b: '2', c: [1,2,3]},
					['1', '2', ['11', '12']]
				]
			}
		}

		this.log(data);
    }
}