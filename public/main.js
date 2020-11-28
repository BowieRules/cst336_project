window.onload = function(){
    fetchData();
};

async function fetchData(){
   let url = "/api/trefle";  
   let response = await fetch(url);    
   let data = await response.json();
   data = data.data;
   var output = "";
    for(let i = 0; i < data.length; i++){
        output += '<u>plant_id</u>: ' + data[i].id + '<br/><u>scientific_name</u>: ' + data[i].scientific_name +'<br/><u>common_name</u>: ' + data[i].common_name + '<br/><br/>';
    }
    $("#data").html(output);
}