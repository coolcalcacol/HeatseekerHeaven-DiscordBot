/**
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
    resetLogOptions: true,
}

module.exports = {
    autoColorizeData: {
        errors: {
            instances: ['undefined', 'null', 'error'],
            fontStyle: 'bold',
            fontColor: 'red',
            bgColor: ''
        },
        statments: {
            instances: ['if', 'else', 'return', 'break', 'continue', 'try', 'catch'],
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
        operators: {
            instances: ['=', '>', '<', '?', '!', '|', '&'],
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
        test11: {
            instances: ['Test'],
            fontStyle: '',
            fontColor: 'test1',
            bgColor: ''
        },
        test21: {
            instances: ['Testing'],
            fontStyle: '',
            fontColor: 'test2',
            bgColor: ''
        },
    },
    logOptions: {
        colorize: true,
        autoColorize: true,
        resetStyle: true,
        newlineMarker: false,
        resetLogOptions: true,
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

        if (Array.isArray(output)) {
            for (const line in output) {
                this.log(output[line], options);
            }
            return;
        }
        else if (this.isJsonString(output)) {
            output = this.formatJsonToString(output);
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
        if (options.colorize) {
            input = this.colorize(input);
        }
        if (options.autoColorize) {
            input = this.autoColorize(input);
        }
        if (options.newlineMarker) {
            str = str.replaceAll('\n', ' ¬\n');
        }
        input = this.setStylePlaceholder(input)
        return input;
    },

    colorize(str) {
        for (const colorType in colors) {
            for (const colorContent in colors[colorType]) {
                const value = this.getStylePlaceholder(colorType, colorContent);
                const strSplit = str.split('[' + colorType + '=' + colorContent + ']')
    
                for (const split in strSplit) {
                    const target = strSplit[split];
                    const segment = target.split('[/>]')[0];
                    str = str.replace('[' + colorType + '=' + colorContent + ']' + segment, value + segment);
                }
            }
        }
        str = str.replaceAll('[/>]', this.getStylePlaceholder('style', 'reset'))
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

                str = str.replaceAll(instance, newInstance);
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
                str = str.replaceAll('◘' + colorType + colorContent + '◘', value);
            }
        }
        str = str.replaceAll(/◘style|◘fg|◘bg/g, '')
        str = str.replaceAll('◘', '');
        
        return str;
    },

    decolorize(str) {
        for (const colorType in colors) {
            for (const colorContent in colors[colorType]) {
                const value = colors[colorType][colorContent];
                str = str.replaceAll(value, '');
            }
        }
        return str;
    },

    formatJsonToString(target) {
        return JSON.parse(JSON.stringify(target));
    },
    isJsonString(target) {
        try {
            var o = JSON.parse(JSON.stringify(target));
    
            // Handle non-exception-throwing cases:
            // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
            // but... JSON.parse(null) returns null, and typeof null === "object", 
            // so we must check for that, too. Thankfully, null is falsey, so this suffices:
            // console.log(o)
            if (o && typeof o === "object") {
                return true;
            }
        }
        catch (e) { }
        
        return false;
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
            name: "John Smith",
            age: 30,
            hobbies: ["Programming", "Video Games"]
        };
        this.log([' ', data, ' ']);
    }
}