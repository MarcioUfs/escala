const objectVsColumn =  (arrResult, selectedColumn) => {
    let arrResultData = [];
    if (arrResult.length !== 0) {
        for (let i = 0; i < arrResult.length; i++) {
            if (arrResult[i] == undefined || arrResult[i] == null) {
                arrResultData.push(JSON.parse(`{"${i}-${Object.values(selectedColumn[i])[0]}-${Object.keys(selectedColumn[i])[0]}":"0"}`))
            } else {
                if (arrResult[i].p === '') {
                    arrResultData.push(JSON.parse(`{"${i}-${Object.values(selectedColumn[i])[0]}-${Object.keys(selectedColumn[i])[0]}":"${Object.values(arrResult[i])}"}`))
                } else if (arrResult[i].f === '') {
                    arrResultData.push(JSON.parse(`{"${i}-${Object.values(selectedColumn[i])[0]}-${Object.keys(selectedColumn[i])[0]}":"${Object.values(arrResult[i])}"}`))
                } else {
                    if (Object.keys(selectedColumn[i])[0] !== undefined || Object.values(selectedColumn[i])[0] !== undefined) {
                        arrResultData.push(JSON.parse(`{"${i}-${Object.values(selectedColumn[i])[0]}-${Object.keys(selectedColumn[i])[0]}":"${Object.values(arrResult[i])}"}`))
                    }

                }
            }
        }
    }else{
        for (let i = 0; i < selectedColumn.length; i++) {
            arrResultData.push(JSON.parse(`{"${i}-${Object.values(selectedColumn[i])[0]}-${Object.keys(selectedColumn[i])[0]}":"0"}`))
        }
    }
    return arrResultData
}
module.exports = objectVsColumn