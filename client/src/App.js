import React from 'react';
import axios from 'axios';
import './App.css'

const serverHost = 'http://localhost:4000';

export default class Upload extends React.Component  {
    state = {
        files: {
            'pnrs': 'Select CSV',
            'flights': 'Select CSV'
        },
        allocations: [],
        allocateEnabled: false
    }

    inputChange = ev => {
        let fileid = ev.target.id;
        let filename = ev.target.value;

        let files = this.state.files;
        files[fileid] = filename.split('\\').pop();
        this.setState({ files: files })

        // Validate CSV files for enabling allocation.
        let enabled = Object.keys(this.state.files).every((file) => {
            return this.state.files[file].endsWith('.csv');
        })
        this.setState({ allocateEnabled: enabled })
    }

    handleSubmit = ev => {
        ev.preventDefault();

        let formData = new FormData(document.querySelector('form'))
        axios.post(`${serverHost}/upload`, formData)
            .then(res => {
                if (res.data && res.data.allocations) {
                    // Defensive.
                    this.setState({ allocations: res.data.allocations });
                }
            })
    }

    // Renders a single allocated PNR-FLIGHT
    renderAllocationRow(props) {
        return (
          <tr key={ props.pnr }>
            <td>{ props.pnr }</td>
            <td>{ props.flight }</td>
          </tr>
        );
    }

    render() {
        return (
            <div>
                <form onSubmit={this.handleSubmit}>
                    <div className="file">
                        <label>Upload PNRs <b>(CSV)</b></label><br/>
                        <input onChange={this.inputChange}
                            id="pnrs" type="file" name="files"/>
                        <label htmlFor="pnrs" className="label-btn">
                            {this.state.files.pnrs}
                        </label>
                    </div>

                    <div className="file">
                        <label>Upload Flights <b>(CSV)</b></label><br/>
                        <input onChange={this.inputChange}
                            id="flights" type="file" name="files"/>
                        <label htmlFor="flights" className="label-btn">
                            {this.state.files.flights}
                        </label>
                    </div>

                    <button disabled={!this.state.allocateEnabled}
                        className="rnd-btn italic" type="submit">Allocate</button>
                </form>

                <table className="center italic">
                    <tbody>
                    { this.state.allocations.map(this.renderAllocationRow) }
                    </tbody>
                </table>
            </div>
        )
    }
}
