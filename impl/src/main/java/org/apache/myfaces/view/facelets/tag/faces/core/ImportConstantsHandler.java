/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package org.apache.myfaces.view.facelets.tag.faces.core;

import java.io.IOException;
// import java.util.Collection;
// import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import jakarta.faces.component.UIComponent;
// import jakarta.faces.component.UIImportConstants;
import jakarta.faces.component.UIViewRoot;
// import jakarta.faces.view.ViewMetadata;
import jakarta.faces.view.facelets.FaceletContext;
import jakarta.faces.view.facelets.TagAttribute;
import jakarta.faces.view.facelets.TagConfig;
import jakarta.faces.view.facelets.TagHandler;

import org.apache.myfaces.buildtools.maven2.plugin.builder.annotation.JSFFaceletAttribute;
import org.apache.myfaces.buildtools.maven2.plugin.builder.annotation.JSFFaceletTag;
import org.apache.myfaces.view.facelets.FaceletViewDeclarationLanguage;

/**
 */
@JSFFaceletTag(
        name = "f:importConstants2",
        bodyContent = "none")
public final class ImportConstantsHandler extends TagHandler
{
    
        private static final String IMPORT_CONSTANTS = "oam.importConstants2";

    @JSFFaceletAttribute(name = "type", className = "jakarta.el.ValueExpression",
                    deferredValueType = "jakarta.el.ValueExpression")
    private final TagAttribute type;

    @JSFFaceletAttribute
    private final TagAttribute var;


    public ImportConstantsHandler(TagConfig config)
    {
        super(config);
        type = getRequiredAttribute("type");
        var = getAttribute("var");
    }

    @Override
    public void apply(FaceletContext ctx, UIComponent parent) throws IOException
    {
      System.out.println("apply - ICH");
      UIViewRoot viewRoot = ctx.getFacesContext().getViewRoot();
      System.out.println("Using viewroot: " + viewRoot);
    //   Map<String, String> importConstantsMap = (Map<String, String>) 
    //             viewRoot.getTransientStateHelper().getTransient(IMPORT_CONSTANTS);
    Map<String, String> importConstantsMap = (Map<String, String>) ctx.getFacesContext().
        getExternalContext().getRequestMap().get(IMPORT_CONSTANTS);
           System.out.println("apply - importConstantsMap " + importConstantsMap);      
        if (importConstantsMap == null)
        {
            System.out.println("importConstantsMap - NULL");
                importConstantsMap = new HashMap<String, String>();
                 System.out.println("var " + var);
                    if (var == null) 
                    {
                        int innerClass = this.type.getValue().lastIndexOf('$');
                        System.out.println("INNERCLASS: " + innerClass);
                        int outerClass = this.type.getValue().lastIndexOf('.');
                        System.out.println("OUTERCLASS: " + outerClass);
                        String varName = this.type.getValue().substring(Math.max(innerClass, outerClass) + 1);
                        System.out.println("VAR: " + varName);
                        importConstantsMap.put(varName, type.getValue());
                    }
                    else
                    {
                        importConstantsMap.put(var.getValue(), type.getValue());
                    }                    
            if (!FaceletViewDeclarationLanguage.isBuildingViewMetadata(ctx.getFacesContext()))
            {
                // viewRoot.getTransientStateHelper().putTransient(IMPORT_CONSTANTS, importConstantsMap);
                ctx.getFacesContext().getExternalContext().getRequestMap().put(IMPORT_CONSTANTS, importConstantsMap);
            }
        }  
    }
}
