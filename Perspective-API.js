// const {google} = require('googleapis');

// // Assuming you've set the GOOGLE_APPLICATION_CREDENTIALS environment variable
// const auth = new google.auth.GoogleAuth({
//   scopes: ['https://www.googleapis.com/auth/cloud-platform']
// });

// const analyzeText = async (text) => {
//   const client = await auth.getClient();
//   const perspective = google.commentanalyzer({version: 'v1alpha1', auth: client});

//   const analyzeRequest = {
//     comment: { text: text },
//     requestedAttributes: { TOXICITY: {} }
//   };

//   const response = await perspective.comments.analyze({ key: 'AIzaSyAuzo1Gi9xUOJJ790SkMh-wveNqS0DoFUQ', resource: analyzeRequest });
//   return response.data;
// };

// // Use the function
// analyzeText('text to analyze').then(response => {
//   console.log(response);
// }).catch(error => {
//   console.error(error);
// });
