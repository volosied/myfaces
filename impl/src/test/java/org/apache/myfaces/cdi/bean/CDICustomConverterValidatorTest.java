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

package org.apache.myfaces.cdi.bean;

import javax.el.ExpressionFactory;
import javax.faces.component.UICommand;
import javax.faces.component.UIOutput;
import org.apache.myfaces.mc.test.core.AbstractMyFacesCDIRequestTestCase;
import org.junit.Assert;
import org.junit.Test;

/**
 *  A unit test to test the CDI @ManagedProperty
 */
public class CDICustomConverterValidatorTest extends AbstractMyFacesCDIRequestTestCase
{

    @Test
    public void testConverter() throws Exception {
        String expectedValue = "Success!";
                                  
        String result;

        startViewRequest("/CDIGenericConverterTest.xhtml");
        processLifecycleExecuteAndRender();

        System.out.println(facesContext.getViewRoot().toString());

        UIOutput out = (UIOutput) facesContext.getViewRoot().findComponent("form1:out1");
        result = out.getValue().toString();

        Assert.assertTrue("The value output should have matched: " + expectedValue + " but was : " + result, result.equals(expectedValue));
    }

    //TODO 
    //@Test
    // public void testValidator() throws Exception {

    // }

    @Override
    protected ExpressionFactory createExpressionFactory()
    {
        // For this test we need the a real one so EL method invocation works.
        return new org.apache.el.ExpressionFactoryImpl();
    }

    
}
