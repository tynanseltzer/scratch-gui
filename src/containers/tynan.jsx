import bindAll from 'lodash.bindall';
import React from 'react';
import VM from 'scratch-vm';
import PropTypes from 'prop-types';
import styles from '../components/gui/gui.css';
import Box from '../components/box/box.jsx';
import printIcon from '../components/gui/icon--print.svg';
import runIcon from '../components/gui/icon--run.svg';

class Tynan extends React.Component {
    constructor (props) {
        super(props);
        this.HANDLE_BLOCK_PRINT = this.HANDLE_BLOCK_PRINT.bind(this);
        this.handlePrintClick = this.handlePrintClick.bind(this);
        this.handleRunCode = this.handleRunCode.bind(this);
        this.handleTyping = this.handleTyping.bind(this);
        this.handleHelper = this.handleHelper.bind(this);
        this.render = this.render.bind(this);
        this.move = this.move.bind(this);
        this.state = {value: ''};
        this.props.vm.runtime.addListener('HANDLE_BLOCK_PRINT2', this.HANDLE_BLOCK_PRINT)
    }
    HANDLE_BLOCK_PRINT (e) {
        this.setState({value: ''})
        for (var tree of e) {
            this.handleHelper(tree, 0);
        }
    }

    handleHelper (node, indent) {
        if (node === null) {
            return;
        }
        var op = node.opcode;
        if (op.localeCompare('motion_movesteps') === 0) {
            var targetName = this.props.vm.runtime.targets[1].sprite.name;
            this.setState(previousState =>
                ({value: previousState.value + ' '.repeat(4 * indent) + 'move(' + node.args[0] + ');\n'}));
            this.handleHelper(node.right, indent);
        }
        else if (op.localeCompare('motion_turnright') === 0) {
            this.setState(previousState =>
                ({value: previousState.value + ' '.repeat(4 * indent) + 'turnRight(' + node.args[0] + ');\n'}));
            this.handleHelper(node.right, indent);
        }
        else if (op.localeCompare('motion_turnleft') === 0) {
            this.setState(previousState =>
                ({value: previousState.value + ' '.repeat(4 * indent) + 'turnLeft(' + node.args[0] + ');\n'}));
            this.handleHelper(node.right, indent);
        }
        else if (op.localeCompare('pen_clear') === 0 || op.localeCompare('pen_penDown') === 0 || op.localeCompare('pen_penUp') === 0) {
            this.setState(previousState =>
                ({value: previousState.value + ' '.repeat(4 * indent) + op.slice(4) + '();\n'}));
            this.handleHelper(node.right, indent);
        }
        else if (op.localeCompare('control_repeat') === 0) {
            var letter = String.fromCharCode(105 + indent);
            this.setState(previousState => ({value:
                    previousState.value + ' '.repeat(4 * indent) + 'for(var ' + letter +  ' = 0; ' + letter + ' < ' + node.args[0] + '; ' + letter + '++) {\n'}));
            this.handleHelper(node.middle, indent + 1);
            this.setState(previousState => ({value:
                    previousState.value + ' '.repeat(4 * indent) + '}\n'}));
            this.handleHelper(node.right, indent);
        }
    }

    handlePrintClick () {
        this.props.vm.print_blocks();
    }

    move (numberSteps) {
        var foo = {STEPS: numberSteps}
        var bar = {target: this.props.vm.runtime.targets[1]}
        this.props.vm.runtime.getOpcodeFunction('motion_movesteps')(foo, bar);
        this.props.vm.runtime.requestTargetsUpdate(this.props.vm.runtime.targets[1]);
    }

    clear () {
        this.props.vm.runtime.getOpcodeFunction('pen_clear')();
    }

    penDown () {
        var foo = {};
        var bar = {target: this.props.vm.runtime.targets[1]}
        this.props.vm.runtime.getOpcodeFunction('pen_penDown')(foo, bar);
    }

    penUp () {
        var foo = {};
        var bar = {target: this.props.vm.runtime.targets[1]}
        this.props.vm.runtime.getOpcodeFunction('pen_penUp')(foo, bar);
    }

    turnLeft (numberDegrees) {
        var foo = {DEGREES: numberDegrees};
        var bar = {target: this.props.vm.runtime.targets[1]}
        this.props.vm.runtime.getOpcodeFunction('motion_turnleft')(foo, bar);
    }

    turnRight (numberDegrees) {
        var foo = {DEGREES: numberDegrees};
        var bar = {target: this.props.vm.runtime.targets[1]}
        this.props.vm.runtime.getOpcodeFunction('motion_turnright')(foo, bar);
    }
    handleRunCode () {
        var theCode = this.state.value.slice(0);
        var funcs = ["move", "turnRight", "turnLeft", "clear", "penDown", "penUp"]
        for (var type of funcs) {
            var re = new RegExp(type, 'g')
            theCode = theCode.replace(re, "this." + type);
        }

        eval(theCode);
    }

    handleTyping(e) {
        this.setState({value: e.target.value});
    }


    render () {
        // const {
        //     vm,
        //     ...props
        // } = this.props;
        return (
            <Box className={styles.tynanWrapper}>
                <button
                    className={styles.print_button}
                    onClick={this.handlePrintClick}
                >
                    <img
                        className={styles.extensionButtonIcon}
                        src={printIcon}
                    />
                </button>

                <button
                    className={styles.run_button}
                    onClick={this.handleRunCode}
                >
                    <img
                        className={styles.extensionButtonIcon}
                        src={runIcon}
                    />
                </button>
                <textarea
                    value={this.state.value}
                    onChange={this.handleTyping}
                    rows="100"
                    style={{fontSize: 18}}
                >
                </textarea>
            </Box>
        );
    }
}

Tynan.propTypes = {
    vm: PropTypes.instanceOf(VM).isRequired
};
export default Tynan;
