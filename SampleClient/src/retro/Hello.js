import React, { useState } from 'react';
import globals from '../globals';
import DatonStack from './DatonStack';
import DatonStackState from './DatonStackState';

//todo remove this after we have navigation

export default function() {
    const [stackstate, setStackState] = useState(null);
    if (!globals.session) return <div>Loading 0</div>;

    //initialize stack
    if (!stackstate) {
        const dss = new DatonStackState()
        setStackState(dss);

        //auto remove from stack after saving
        dss.onLayerSaved = datonKey => dss.removeByKey(datonKey, true);

        return <div>Loading 4</div>;
    }

    return (
        <>
            <button onClick={() => stackstate.add('PhoneTypeLookup|+', false)}>View Phone Types</button>
            <button onClick={() => stackstate.add('Employee|=1', false)}>View Employee 1</button>
            <button onClick={() => stackstate.add('Customer|=1', false)}>View Customer 1</button>
            <button onClick={() => stackstate.add('Customer|=2', false)}>View Customer 2</button>
            <button onClick={() => stackstate.add('Employee|=-1', true)}>Create Employee</button>
            <button onClick={() => stackstate.add('Customer|=-1', true)}>Create Customer</button>
            <button onClick={() => stackstate.add('CustomerList|Company=wid', false)}>View Customer List</button>
            <button onClick={() => stackstate.add('EmployeeList', false)}>View Employee List</button>
            <hr/>
            <DatonStack session={globals.session} stackstate={stackstate} />
        </>
    );
}