# RESTAURANT REVIEWS

***DEMO***: <https://restaurant-reviews.netlify.com/>

The restaurant reviews application is the project required to complete the Mobile Web Specialist Nanodegree offered through Udacity as part of the Grow with Google scholarship program.

## Running the Application Locally

To run the application on your localhost, clone this repository and then:

- Go get a [Google Maps API key](https://developers.google.com/maps/documentation/javascript/get-api-key).

- Create a ```config.dev.js``` file inside the ```/src/config``` directory with the following structure:

  ```javascript
  export default {
    HOST: 'http://localhost',
    PORT: '8080',
    MAPS_KEY: 'ENTER YOUR MAP KEY HERE',
  };
  ```

  > For production builds, you will also need a ```config.prod.js``` file. I recommend you create a separate Google Maps API key for production.

- From the terminal, run the command ```npm install``` to install project dependencies.

- Finally, run the command ```npm start``` to spin up the development server with hot module replacement and live reloading enabled.

- Point your browser at <http://localhost:8080>.

## Project Details

The project is broken down into three stages, each with their own deadline and specifications. Using libraries and frameworks is prohibited.

Code should adhere to the Udacity HTML, CSS, JavaScript, and Git [style guidelines](https://udacity.github.io/frontend-nanodegree-styleguide/index.html).

### Deadlines

| Stage | Deadline          |
| ----- | ----------------- |
| One   | June 12, 2018     |
| Two   | August 11, 2018   |
| Three | September 8, 2018 |

### Stage One Requirements

**Make the provided site fully responsive.** Convert the [provided website](https://github.com/udacity/mws-restaurant-stage-1) to a fully responsive application:

- [X] All of the page elements should be usable and visible in any viewport, including desktop, table, and mobile diplays.

- [X] Images shouldn't overlap.

- [X] Page elements should wrap when the viewport is too small to display them side-by-side.

**Make the site accessible.** The application should be accessible.

- [X] Ensure that ```alt``` attributes are present and descriptive for images.

- [X] Add screen-reader-only attributes when appropriate to add useful supplementary text.

- [X] Use semantic markup where possible and ```aria``` attributes when semantic markup is not feasible.

**Cache the static site for offline use.** The application should be available offline or during intermittent connectivity.

- [X] Using the ```Cache API``` and a ```ServiceWorker``` cache the data for the website so that any resource (including images) that has been visited is accessible offline.

### Grading Rubric, Stage One

#### Responsive Design

|   | CRITERIA | SPECIFICATIONS |
| - | -------- | -------------- |
| ✓ | Is the site UI compatible with a range of display sizes? | All content is responsive and displays on a range of display sizes. Content should make use of available screen real estate and should display correctly at all screen sizes. An image's associated titlee and text renders next to the image in all viewport sizes. |
| ✓ | Are images responsive? | Images in the site are sized appropriate to the viewport and do not crowd or overlap other elements in the browser, regardless of viewport size. |
| ✓ | Are application elements visible and usable in all viewports? | On the main page, restaurants and images are displayed in all viewports. The detail page includes a map, hours and reviews in all viewports. |

#### Accessibility

|   | CRITERIA | SPECIFICATIONS |
| - | -------- | -------------- |
| ✓ | Are images accessible? | All content-related images include appropriate alternate text that clearly describes the content of the image. |
| ✓ | Is focus used appropriately to allow easy navigation of the site? | Focus is appropriately managed allowing users to noticeably tab through each of the important elements of the page. Modal or interstitial windows appropriately lock focus. |
| ✓ | Are site elements defined semantically? | Elements on the page use the appropriate semantic elements. For those element in which a semantic element is not available, appropriate ```aria-role```s are defined. |

#### Offline Availability

|   | CRITERIA | SPECIFICATIONS |
| - | -------- | -------------- |
| ✓ | Are pages that have been visited available offline? | When available in the browser, the site uses a ```ServiceWorker``` to cache responses to requests for site assets. Previously visited pages are rendered when there is no network access. |

### Stage Two Requirements

TODO...

### Grading Rubric, Stage Two

#### Application Data and Offline Use

|   | CRITERIA | SPECIFICATIONS |
| - | -------- | -------------- |
| ✖ | Application Data Source | The client application should pull restaurant data from the development server, parse the JSOn response, and use the information to render the appropriate sections of the application UI. |
| ✖ | Offline Use | The client application works offline. JSON responses are cached using the ```IndexedDB API```. Any data previously accesed while connected is reachable while offline. |

#### Responsive Design and Accessibility

|   | CRITERIA | SPECIFICATIONS |
| - | -------- | -------------- |
| ✓ | Responsive Design | The application maintains a responsive design on mobile, table, and desktop viewports. |
| ✓ | Accessibility | The application retains accessibility features from the Stage One project. Images have alternate text, the application uses appropriate focus management for navigation, and semantic elements and ```aria``` attributes are used correctly. |

#### Performance

|   | CRITERIA | SPECIFICATIONS |
| - | -------- | -------------- |
| ✖ | Site Performance | Lighthouse targets for each category exceed:<br><br>Progressive Web App: >90<br>Performance: >70<br>Accessibility: >90 |

### Stage Three Requirements

TODO...

### Grading Rubric, Stage Three

#### Functionality

|   | CRITERIA | SPECIFICATIONS |
| - | -------- | -------------- |
| ✖ | User Interface | Users are able to mark a restaurant as a favorite, this toggle is visible in the application. A form is added to allow users to add their own reviews for a restaurant. Form submission works properly and adds a new review to the database. |
| ✖ | Offline Use |The client application works offline. JSON responses are cached using the ```IndexedDB API```. Any data previously accessed while connected is reachable while offline. User is able to add a review to a restaurant while offline and the review is sent to the server when connectivity is reestablished. |

#### Responsive Design and Accessibility, continued

|   | CRITERIA | SPECIFICATIONS |
| - | -------- | -------------- |
| ✖ | Responsive Design | The application maintains a responsive design on mobile, table, and desktop viewports. All new features are responsive, including the form to add a review and the control for marking a restaurant as a favorite. |
| ✖ | Accessibility | The application retains accessibility features from the previous projects. Images have alternate text, the application uses appropriate focus management for navigation, and semantic elements and ```aria``` attributes are used correctly. ```aria-role```s are correctly defined for all elements of the review form. |

#### Performance Boost

|   | CRITERIA | SPECIFICATIONS |
| - | -------- | -------------- |
| ✖ | Site Performance | Lighthouse targets for each category exceed:<br><br>Progressive Web App: >90<br>Performance: >90<br>Accessibility: >90 |