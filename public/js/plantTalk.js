$(document).ready(function() {
            populateMyPlants();
            populatePosts();
}); // form load
    
async function populateMyPlants() {
    let url = `/api/getMyPlants`;
    let response = await fetch(url);
    let data = await response.json();
    $("#usersPlant").html("<option> Select a plant to post about </option>");
    for (let i=0; i< data.length; i++) {
        $("#usersPlant").append(`<option value="${data[i].PlantId}"> ${data[i].Common_Name} </option>`);
    }
}

async function populatePosts() {
    // get posts
    let postUrl = `/api/getPosts`;
    let postResponse = await fetch(postUrl);
    let postData = await postResponse.json();

    // get comments
    let commentUrl = `/api/getComments`;
    let commentsResponse = await fetch(commentUrl);
    let commentData = await commentsResponse.json();
    // map comments list to post
    var map = {};
    for (let i=0; i< postData.length; i++) {
        var key = postData[i].PostId;
        map[key] = [];
    }
    for (let i=0; i< commentData.length; i++) {
        var key = commentData[i].PostId;
        map[key].push(commentData[i]);
    }

    $(".postsContainer").html("");
    
    
    for (let i=0; i< postData.length; i++) {
        key = postData[i].PostId;
        let dtPost = new Date(postData[i].PostDte).toLocaleString();
        
        let postHtml = `
        <!-- Card -->
<article>
<div class="card bg-dark">
<img class="card-img-top" src="${getOutput(postData[i].Image_Url)}" alt="${getOutput(postData[i].Common_Name)}">
<div class="text-white text-center d-flex align-items-center rgba-black-strong py-5 px-4">
 
    <div class="col-xs-6">
      <h5 class="text-success"><i class="fas fa-leaf"></i> Post by ${getOutput(postData[i].LoginName)} on ${getOutput(dtPost)}</h5>
      <h3 class="card-title pt-2"><strong>${getOutput(postData[i].Topic)}</strong></h3>
      <p>${getOutput(postData[i].PostText)}</p>
    </div>
    <div class="col-xs-6">
        <ul class="list-inline float-right text-muted text-right my-0 py-1 pr-3">
          <li><b>Common Name:</b> ${getOutput(postData[i].Common_Name)}</li>
          <li><b>Scientific Name: </b>${getOutput(postData[i].Scientific_Name)}</li>
          <li><b>Family: </b>${getOutput(postData[i].Family)}</li>
          <li><b>Genus:</b> ${getOutput(postData[i].Genus)}</li>
          <li><b>USDA Hardiness Zone:</b> ${getOutput(postData[i].Hardiness)}</li>
          <li><b>Watering Frequency:</b> ${getOutput(postData[i].WaterFrequency)}</li>
          <li><b>Soil Used:</b> ${getOutput(postData[i].Soil)}</li>
          <li><b>Light Exposure:</b> ${getOutput(postData[i].LightExposure)}</li>
          <li><b>Fertilization:</b> ${getOutput(postData[i].Fertilization)}</li>
          <li><b>User Notes:</b> ${getOutput(postData[i].Description)}</li>
        </ul>
    </div>
</div>
</div>
</article>
<!-- Card -->`;

        $(".postsContainer").append(postHtml);

        let commentsHTML = '<article><div class="card bg-light text-left"><div class="card-header"><span class="fas fa-comment"></span>' +
'  Recent Comments  <span class="badge badge-success">' + map[key].length + '</span></div><div class="card-text">'+
'<ul class="list-group list-group-flush">';
        
        
        for (let j=0; j< map[key].length; j++){
            let comment = map[key][j];
            let dtComment = new Date(comment.CommentDte).toLocaleString();
            commentsHTML += '<li class="list-group-item  list-group-item-light"><div class="d-flex w-100 justify-content-between">' +
            '<p>' + comment.CommentText + '</p><small class="text-muted">' + 'By ' + comment.LoginName + ' on ' + dtComment + '</small></div></li>';
        }
        commentsHTML += '</ul></div></div>';
        $(".postsContainer").append(commentsHTML);
        $(".postsContainer").append(`<br />`);
        $(".postsContainer").append(`<article><form action="/addCommment" method="POST"><div class="form-group row w-75">
<div class="col-sm-10">
  <input type="hidden" name="postId" value="${postData[i].PostId}"><input type="text" class="form-control" name="userComments" size="125" />
</div>
<div class="col-sm-2">
  <input type="submit" class="btn btn-outline-success" value="Post your comment">
</div>
</div>
</form></article>`);
        $(".postsContainer").append(`</div>`);
        $(".postsContainer").append(`</div><br /><br />`);
    }
     $(".postsContainer").append(`</div></article><br /><br />`);
}

// replace null values with empty strings
function getOutput(value) {
    return (value == null) ? "" : value;
}