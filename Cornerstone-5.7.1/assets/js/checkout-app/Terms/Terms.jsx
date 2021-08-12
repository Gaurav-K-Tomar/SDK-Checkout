import React, { Fragment } from 'react';
import Section from '../components/Section/section';
import CheckboxInput from '../components/CheckboxInput/checkbox-input';
import TextInput from '../components/TextInput/text-input';
import RadioContainer from '../components/RadioContainer/radio-container';

export default class Terms extends React.PureComponent {
    constructor(props) {
        super(props);

        // this.state = {
        //     paymentData: {},
        //     methodId: null,
        //     gatewayId: null,
        // };
    }
   

    render() {
        const { enable,link,type,conditions } = this.props;
        
        return (
        enable == true ? 
            <Section
                header={ 'Terms & Condition' }
                body={
                    <Fragment>
                        {/* { this.props.errors &&
                            <Alert body={ this.props.errors.message } />
                        } */}
                        <RadioContainer
                            label={'' }
                            body={ 
                                <Fragment> 
                                    <CheckboxInput
                                    name={ 'terms' }
                                    optional={false}
                                    label = {type == 'link' ?
                                        <Fragment> 
                                            <span>Yes, I agree with the &nbsp; </span>
                                            <a href={link}>terms and conditions</a>
                                        </Fragment> :
                                            'Yes, I agree with the above terms and conditions'}
                                    />
                                    {  
                                        type == 'link' ?'' : <TextInput textarea={true} readOnly={true} value={conditions} />
                                    }
                                </Fragment>
                            }
                        />
                    </Fragment>
                } /> : ""                
        )        
    }
}
