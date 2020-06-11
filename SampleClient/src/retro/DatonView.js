import React, { useState, useRef } from 'react';
import CardView from './CardView';
import GridView from './GridView';
import {TableRecurPointFromDaton, DatonKey, parseDatonKey} from 'retrodry';
import DatonBanner from './DatonBanner';
import CardStack from './CardStack';

//given the old viewon key and criset (object indexed by coldef names, containing strings), build a new key
function buildViewonKey(oldKey, tableDef, criset) {
    const parsedOldKey = parseDatonKey(oldKey);
    const segments = [];
    for (let colDef of tableDef.cols) {
        const criValue = criset[colDef.name];
        if (criValue) segments.push(colDef.name + '=' + criValue);
    }
    return new DatonKey(parsedOldKey.typeName, segments).toKeyString();
}

//Displays or edits one daton
//props.datonDef is the daton definition (DatonDefResponse)
//props.daton is the daton (non-editable version)
//props.session is the session for obtaining layouts
//props.edit is true to display initially with editors; false for read only
//props.stackstate is the optional DatonStackState instance for the containing stack (can be omitted if this is used outside a stack)
export default React.memo(props => {
    const {datonDef, session, edit, stackstate} = props;
    const [topStyle, setTopStyle] = useState(null); //'c' or 'g' for card or grid; null on first render
    const [isEditing, setIsEditing] = useState(edit);
    const [isWorking, setIsWorking] = useState(edit);
    const [daton, setDaton] = useState(props.daton);
    const [errorItems, setErrorItems] = useState([]); //array of strings to display as errors
    const criset = useRef({});

    const isFirstRender = !topStyle;

    //grid or card?
    let localTopStyle = topStyle;
    if (!topStyle) {
        //try using grid if possible
        if (datonDef.multipleMainRows) {
            const mainGridLayout = session.getGridLayout(datonDef.name, datonDef.mainTableDef.name);
            const mainCardLayout = session.getCardLayout(datonDef.name, datonDef.mainTableDef.name);
            if ((mainGridLayout && !mainGridLayout.isAutoGenerated) || !mainCardLayout || mainCardLayout.isAutoGenerated) {
                setTopStyle('g');
                localTopStyle = 'g';
            }
        }

        //use card if grid wasn't possible
        if (!localTopStyle) {
            setTopStyle('c');
            localTopStyle = 'c';
        }
    }

    //event handlers
    const editClicked = () => {
        setIsWorking(true);
        session.get(daton.key, {doSubscribeEdit:true, forceCheckVersion:true}).then(d => {
            setDaton(d);
            session.changeSubscribeState([d], 2).then(errors => {
                setIsWorking(false);
                const myerrors = errors[d.key];
                if (myerrors) {
                    setErrorItems(['Cannot lock']); //todo language
                    setIsEditing(false);
                } else {
                    setIsEditing(true);
                    setErrorItems([]);
                }
            })
        });
    };
    const saveClicked = () => {
        setIsWorking(true);
        session.save([daton]).then(saveInfo => {
            setIsWorking(false);
            if (saveInfo.success) {
                setIsEditing(false);
                session.changeSubscribeState([daton], 1).then(errors => {
                    const myerrors = errors[daton.key];
                    if (myerrors) {
                        setErrorItems(['Cannot unlock']); //todo language
                    } else {
                        setErrorItems([]);
                    }
                    if (stackstate.onLayerSaved) stackstate.onLayerSaved(daton);
                });
            } else {
                const result = saveInfo.details[0];
                setErrorItems(result.errors || []);
            }
        });
    };
    const cancelClicked = () => {
        setIsEditing(false);
        session.get(daton.key, {doSubscribeEdit:false, forceCheckVersion:true}).then(d => {
            setDaton(d);
        });
    };
    const removeClicked = () => {
        if (isEditing) return;
        stackstate.removeByKey(daton.key, true);
    };
    const doSearch = () => {
        if (!stackstate) return;
        const newKey = buildViewonKey(daton.key, datonDef.criteriaDef, criset.current);
        stackstate.replaceViewonKey(daton.key, newKey);
    };

    //optionally start editing on first render
    if (isFirstRender && edit) editClicked();

    //set topContent to grid or card view of main table
    let topContent;
    if (localTopStyle === 'c') {
        if (datonDef.multipleMainRows) {
            const rt = TableRecurPointFromDaton(datonDef, daton); 
            topContent = <CardStack session={session} rows={rt.table} datonDef={datonDef} tableDef={datonDef.mainTableDef} edit={isEditing}/>;
        } else {
            topContent = <CardView session={session} row={daton} datonDef={datonDef} tableDef={datonDef.mainTableDef} edit={isEditing} />;
        }
    } else { //grid
        if (datonDef.multipleMainRows) {
            const rt = TableRecurPointFromDaton(datonDef, daton); 
            topContent = <GridView session={session} rows={rt.table} datonDef={datonDef} tableDef={datonDef.mainTableDef} edit={isEditing} />;
        } else {
            topContent = null; //should not use grids with single main row
        }
    }

    //set criteriaContent to optional criteria card
    let criteriaContent = null;
    if (datonDef.criteriaDef) {
        criteriaContent = 
            <div className="criteria-block">
                <CardView session={session} criset={criset.current} datonDef={datonDef} tableDef={datonDef.criteriaDef} />
                <div>
                    <button className="search-button" onClick={doSearch}>Search</button>
                </div>
            </div>;
    }

    //set up banner props
    let bannerState = 0;
    if (datonDef.isPersiston) bannerState = 1;
    if (isEditing) bannerState = 2;
    if (isWorking) bannerState = -1;

    return (
        <div className="daton">
            <DatonBanner datonDef={datonDef} editState={bannerState} editClicked={editClicked} saveClicked={saveClicked} 
                cancelClicked={cancelClicked} removeClicked={removeClicked} />
            {errorItems.length > 0 && <ul className="daton-errors">
                {errorItems.map(s => <li>{s}</li>)}
            </ul>}
            {criteriaContent}
            {topContent}
        </div>
    );
});