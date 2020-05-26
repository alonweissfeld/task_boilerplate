import React from 'react';
import axios from 'axios';

export default class Upload extends React.Component  {
    state = {
        allocations: []
    }

    handleSubmit = ev => {
        ev.preventDefault();

        let formData = new FormData(document.querySelector('form'))
        axios.post('http://localhost:4000/upload', formData)
            .then(res => {
                console.log(res.data);
                if (res.data && res.data.allocations) {
                    // Defensive.
                    this.setState({ allocations: res.data.allocations });
                }
            })
    }

    // Renders a single allocated PNR-FLIGHT
    renderAllocationRow(props) {
        console.log(props);
        return (
          <tr>
            <td>{ props.pnr }</td>
            <td>{ props.flight }</td>
          </tr>
        );
    }

    render() {
        return (
            <div>
                <form onSubmit={this.handleSubmit}>
                    <div class="file">
                        <label>Upload PNRs</label>
                        <input type="file" name="files"/>
                    </div>

                    <div class="file">
                        <label>Upload Flights</label>
                        <input type="file" name="files"/>
                    </div>

                    <button type="submit">Allocate</button>
                </form>

                <table>
                    { this.state.allocations.map(this.renderAllocationRow) }
                </table>
            </div>
        )
    }
}
