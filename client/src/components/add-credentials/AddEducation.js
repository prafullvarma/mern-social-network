import React from 'react';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import TextFieldGroup from '../common/TextFieldGroup';
import TextAreaFieldGroup from '../common/TextAreaFieldGroup';
import PropTypes from 'prop-types';
import { addEducation } from '../../actions/profileActions';

class AddEducation extends React.Component{
  constructor(props){
    super(props);

    this.state = {
      school: '',
      degree: '',
      fieldofstudy: '',
      from: '',
      to: '',
      current: false,
      description: '',
      errors: {}
    };

    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.onCheck = this.onCheck.bind(this);
  }

  componentWillReceiveProps(nextProps){
    if(nextProps.errors) this.setState({errors: nextProps.errors});
  }

  onChange(e){
    this.setState({[e.target.name]: e.target.value});
  }

  onCheck(e){
    this.setState({
      disabled: !this.state.disabled,
      current: !this.state.current
    });
  }

  onSubmit(e){
    e.preventDefault();

    const eduData = {
      school: this.state.school,
      degree: this.state.degree,
      fieldofstudy: this.state.fieldofstudy,
      from : this.state.from,
      to: this.state.to,
      current: this.state.current,
      description: this.state.description
    };

    this.props.addEducation(eduData, this.props.history);
  }

  render(){
    const { errors } = this.state;

    return (
      <div className="add-education">
        <div className="container">
          <div className="row">
            <div className="col-md-8 m-auto">
              <Link to='/dashboard'>Go Back</Link>
              <h1 className="display-4 text-center">Add education</h1>
              <p className="lead text-center">
                Add any course or school that you have attended.
              </p>
              <small className="d-block pb-3">* = Required Fields</small>
              <form onSubmit={this.onSubmit}>
                <TextFieldGroup
                  name="school"
                  placeholder="* School"
                  error={errors.school}
                  onChange={this.onChange}
                  value={this.state.school}
                />
                <TextFieldGroup
                  name="degree"
                  placeholder="* Degree"
                  error={errors.degree}
                  onChange={this.onChange}
                  value={this.state.degree}
                />
                <TextFieldGroup
                  name="fieldofstudy"
                  placeholder="* Field of Study"
                  error={errors.fieldofstudy}
                  onChange={this.onChange}
                  value={this.state.fieldofstudy}
                />
                <h6>* From Date</h6>
                <TextFieldGroup
                  name="from"
                  type="date"
                  onChange={this.onChange}
                  error={errors.from}
                  value={this.state.from}
                />
                <h6>To Date</h6>
                <TextFieldGroup
                  name="to"
                  type="date"
                  onChange={this.onChange}
                  error={errors.to}
                  disabled={this.state.disabled? 'disabled': ''}
                  value={this.state.to}
                />
                <div className="form-check mb-4">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    name="current"
                    value={this.state.current}
                    checked={this.state.current}
                    onChange={this.onCheck}
                    id="current"
                  />
                  <label htmlFor="current" className="form-check-label">
                    Current Job
                  </label>
                </div>
                <TextAreaFieldGroup
                  placeholder="Course Description"
                  name="description"
                  value={this.state.description}
                  onChange={this.onChange}
                  error={errors.description}
                  info="Tell us about course"
                 />
                <input type="submit" value="Submit" className="btn btn-info btn-block" />
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

AddEducation.propTypes = {
  addEducation: PropTypes.func.isRequired,
  profile: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired
}

const mapStateToProps = state => ({
  profile: state.profile,
  errors: state.errors
});

export default connect(mapStateToProps, {addEducation} )(withRouter(AddEducation));
