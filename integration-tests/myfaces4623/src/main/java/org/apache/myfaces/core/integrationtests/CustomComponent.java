package org.apache.myfaces.core.integrationtests;

import jakarta.faces.application.ResourceDependency;
import jakarta.faces.component.FacesComponent;
import jakarta.faces.component.html.HtmlInputText;
import jakarta.faces.event.ComponentSystemEvent;

@FacesComponent(
   createTag = true,
   namespace = "test"
)
@ResourceDependency(
   library = "default",
   name = "js/test.js"
)
public class CustomComponent extends HtmlInputText {
   public void processEvent(ComponentSystemEvent event) {
      super.processEvent(event);
   }
}
