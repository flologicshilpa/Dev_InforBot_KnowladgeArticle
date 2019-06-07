function SubmitData_callback_OTS(data) {
    $find("MP_Loading").hide();
    alert(data.d[0]);
    $('#txt_isResoSaved').val(data.d[1]);
    window.location.reload(false);

}

function updatedata_callback_OTS(data,path) {
    $find("MP_Loading").hide();
    alert(data.d);
    window.location.reload(false);
    window.location.replace(path);
   // window.opener.getOTSDetails($("#txt_assetid").val());
}

function SubmitData_callback_Sur(data) {
    $find("MP_Loading").hide();
    alert(data.d[0]);
    $('#txt_isResoSaved').val(data.d[1]);
    window.location.reload(false);
  
}

function updatedata_callback_Sur(data, path) {
    $find("MP_Loading").hide();
    alert(data.d);  
    // window.location.replace(path); 
    window.history.back();
}

function SubmitData_callback_DRT(data) {
    $find("MP_Loading").hide();
    alert(data.d[0]);
    $('#txt_isResoSaved').val(data.d[1]);
    window.location.reload(false);  
}

function updatedata_callback_DRT(data,path) {
    $find("MP_Loading").hide();
    alert(data.d);    
    //  window.location.replace(path);  
    window.history.back();
}