function uploadError(sender, args) {
    alert(args.get_errorMessage());
    var uploadText = document.getElementById('FileUpload1').getElementsByTagName("input");
    for (var i = 0; i < uploadText.length; i++) {
        if (uploadText[i].type == 'text') {
            uploadText[i].value = '';
        }
    }
}

function StartUpload(sender, args) {

}

function UploadComplete(sender, args) {
    var filename = args.get_fileName();
    filename = filename.replace(/[&\/\\#,+()$~%'":*?<>{} ]/g, "");

    var fileNameSplit = filename.split('.');

    var contentType = args.get_contentType();
    var filelength = args.get_length();
    if (parseInt(filelength) == 0) {
        alert("Sorry cannot upload file ! File is Empty or file does not exist");
    }
    else if (parseInt(filelength) > 8000000) {
        alert("Sorry cannot upload file ! File Size Exceeded.");
    }
    else if (contentType == "application/octet-stream" && fileNameSplit[1] == "exe") {
        alert("Kindly Check File Type.");
    }
    else {
        addToClientTable(filename, args.get_length());
    }
    var uploadText = document.getElementById('FileUpload1');
    if (uploadText) {
        uploadText = uploadText.getElementsByTagName("input");
        for (var i = 0; i < uploadText.length; i++) {
            if (uploadText[i].type == 'text') {
                uploadText[i].value = '';
            }
        }
    }
    document.forms[0].target = "";
}

function addToClientTable(name, size) {
    var HTML = "";
    var tbl = document.getElementById("tbl_DocumentDtl");
    var lastRow = tbl.rows.length;
    var row = tbl.insertRow(lastRow);

    oCell = row.insertCell(-1);
    HTML = lastRow;
    oCell.innerHTML = HTML;
    oCell.align = "center";
    oCell.style.display = "none"

    oCell = row.insertCell(-1);
    HTML = "<a id='a_downloadfiles" + lastRow + "' style='cursor: pointer' onclick=\"return downloadfiles('" + lastRow + "');\" >" + name + "</a>";
    oCell.innerHTML = HTML;
    oCell.align = "left";

    oCell = row.insertCell(-1);
    HTML = "<input id='textdesc" + lastRow + "' type='text' class='form-control' style='vertical-align:middle; cursor:pointer;'/>";
    oCell.innerHTML = HTML;
    oCell.align = "center";

    oCell = row.insertCell(-1);
    HTML = "<img id='del" + lastRow + "' alt='Click Here To Delete The Record.'  onclick=\"return deletefile(" + (lastRow) + ");\" src='../../images/delete.png'  style='vertical-align:middle; cursor:pointer;'/>";
    oCell.innerHTML = HTML;
    oCell.align = "center";
}

function downloadfiles(index) {
    var tbl = document.getElementById("tbl_DocumentDtl");
    //var lastRow = tbl.rows.length;
    window.open('/IARC/Common/FileDownload.aspx?enquiryno=NA&filename=' + tbl.rows[index].cells[1].innerText + '&filetag=', 'Download', 'left=150,top=100,width=600,height=300,toolbar=no,menubars=no,status=no,scrollbars=yes,resize=no');
}

//to delete file from list
function deletefile(RowIndex) {
    try {
        var tbl = document.getElementById("tbl_DocumentDtl");
        var lastRow = tbl.rows.length;
        var filename = tbl.rows[RowIndex].cells[1].innerText;
        if (lastRow <= 1)
            return false;
        for (var contolIndex = RowIndex; contolIndex < lastRow - 1; contolIndex++) {
            document.getElementById("del" + (contolIndex + 1)).onclick = new Function("deletefile(" + contolIndex + ")");
            document.getElementById("del" + (contolIndex + 1)).id = "del" + contolIndex;
            document.getElementById("a_downloadfiles" + (contolIndex + 1)).onclick = new Function("downloadfiles(" + contolIndex + ")");
            document.getElementById("a_downloadfiles" + (contolIndex + 1)).id = "a_downloadfiles" + contolIndex;
        }
        tbl.deleteRow(RowIndex);
        deletephysicalfile(filename);
    }
    catch (Exc) { }
}
