function isSpecialChar(evt) {
    var k = (evt.which) ? evt.which : event.keyCode
    return ((k > 64 && k < 91) || (k > 96 && k < 123) || k == 8 || k == 32 || (k >= 48 && k <= 57));
}

function isNumberKey(evt) {
    var charCode = (evt.which) ? evt.which : event.keyCode
    if (charCode > 31 && (charCode < 48 || charCode > 57))
        return false;
    return true;
}

function getSelectedText(elementId) {
    var elt = document.getElementById(elementId);
    if (elt.selectedIndex == -1)
        return null;
    return elt.options[elt.selectedIndex].text;
}

function getMonthFromString(mon) {
    var month = new Date(Date.parse(mon + " 1, 2012")).getMonth() + 1;
    return month;
}

function ReplaceSpecialCharacters(inputstring) {
    inputstring = inputstring.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/%/g, "%").replace(/-/g, "&hypen;").replace(/:/g, "&colon;").replace("#", "&hash;").replace(/@/g, "@").replace(/=/g, "&equal;").replace(/'/g, "&apos;").replace("(", "&open;").replace(")", "&close;").replace(".", "&dot;").replace("/", "&fslash;").replace("+", "&plus;");
    return inputstring;
}

function ReplaceSpecialCharactersXML(inputstring) {
    inputstring = inputstring.Replace("&", "&amp;").Replace(">", "&gt;").Replace("<", "&lt;").Replace("||", ">").Replace("|", "<").Replace("'", "&apos;");
    return inputstring;
}


function ValidateRequiredFields(evt) {
    for (var i = 0; i < arguments.length; i++) {
        if (document.getElementById(arguments[i]).nodeName == "INPUT" && document.getElementById(arguments[i]).value == '') {
            alert("Please Provide Required Fields");
            document.getElementById(arguments[i]).focus();
        }
        if (document.getElementById(arguments[i]).nodeName == "SELECT" && document.getElementById(arguments[i]).value == '0') {
            alert("Please Provide Required Fields");
            document.getElementById(arguments[i]).focus();
        }
    }
}

function replaceSpecialChar(xmlstring) {
    var temp = xmlstring;
    temp = temp.replace(/&/g, "&amp;");
    // temp = temp.replace(/"/g, "&quot;");
    //temp = temp.replace(/'/g, "&apos;");
    //temp = temp.replace(/</g, "&lt;");
    // temp = temp.replace(/>/g, "&gt;");

    return temp;
}

function validateDecimal(eve, myid) {
    var charCode = (eve.which) ? eve.which : event.keyCode;
    if ((charCode > 31 && (charCode < 48 || charCode > 57)) && charCode != 46) {
        //alert("Please Enter numeric value.");
        // event.keyCode = 0;
        return false
    }
    if (myid.value.indexOf(".") !== -1) {
        //  var range = document.selection.createRange();
        if (myid.value != "") {
        }
        else {
            var number = myid.value.split('.');
            if (number.length == 2 && number[1].length > 1)
                //    event.keyCode = 0;
                return false;
        }
    }
    return true;
}



function titleCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}


