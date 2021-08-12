import React from 'react';
import InputContainer from '../InputContainer/input-container'
import styles from './text-input.scss';

export default class TextInput extends React.PureComponent {
    render() {
        return (
            <InputContainer
                id={ this.props.id }
                label={ this.props.label }
                helpText={ this.props.optional ? 'Optional' : '' }
                width={ this.props.width }
                body={
                    this.props.textarea == true ?
                    <textarea
                    type="text"
                    id={ this.props.id }
                    value={ this.props.value || '' }
                    required={ !this.props.optional }
                    onChange={ this.props.onChange }
                    placeholder={ this.props.placeholder }
                    className={ styles.input }
                    onBlur ={this.props.onBlur} 
                    readOnly={this.props.readOnly || false} 
                    cols="30" 
                    rows="10"></textarea>
                    :
                    <input
                        // type="text"
                        // pattern="\d{4}-\d{2}-\d{2}"
                        type = {this.props.type == 'date' ? 'text' : this.props.type|| 'text'}
                        id={ this.props.id }
                        value={ this.props.value || '' }
                        required={ !this.props.optional }
                        onChange={ this.props.onChange }
                        placeholder={ this.props.placeholder }
                        className={`${ styles.input }`}
                        onBlur ={this.props.onBlur} 
                        readOnly={this.props.readOnly || false}                         
                        />
                } />
        );
    }
}
