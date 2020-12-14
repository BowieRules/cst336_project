window.onload = function(){
    // add listener to search result option buttons
    $(".option").on("click", function(){
        const id = $(this).attr("id").split(";", 6);
        $(this).disabled = true;
        addToYourPlants(id);
    });
};
// inserts selected plant into table
async function addToYourPlants(id){
   // insert into Plant table
   let url = `/api/insertPlant?id=${id[0]}&image_url=${id[1]}&genus=${id[2]}&scientific_name=${id[3]}&family=${id[4]}&common_name=${id[5]}`;
   let response = await fetch(url);
   let data = await response.json();
   // insert into LoginPlant table (id is dependent on Plant table insertion)
   let PlantId = data[0].PlantId;
   let url2 = `/api/insertLoginPlant?id=${PlantId}`;
   let response2 = await fetch(url2);
   let text = await response2.text();
   // let the user know of success or failure
   alert(text);
}