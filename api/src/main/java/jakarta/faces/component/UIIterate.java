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
package jakarta.faces.component;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import org.apache.myfaces.buildtools.maven2.plugin.builder.annotation.JSFProperty;
import org.apache.myfaces.core.api.shared.EditableValueHolderState;

import jakarta.faces.application.StateManager;
import jakarta.faces.context.FacesContext;

public abstract class UIIterate extends UIComponentBase implements NamingContainer {

    protected Map<String, Map<String, Object>> _rowDeltaStates = new HashMap<>();
    protected Map<String, Map<String, Object>> _rowTransientStates = new HashMap<>();

    protected static final Object[] LEAF_NO_STATE = new Object[] { null, null };

    protected Object _initialDescendantComponentState = null;

    protected Object _initialDescendantFullComponentState = null;

    /**
     * Overwrite the state of the child components of this component with data
     * previously saved by method
     * saveDescendantComponentStates.
     * <p>
     * The saved state info only covers those fields that are expected to vary
     * between rows of a table. Other fields are
     * not modified.
     */
    @SuppressWarnings("unchecked")
    protected void restoreDescendantComponentStates(UIComponent parent, boolean iterateFacets, Object state,
            boolean restoreChildFacets) {
        int descendantStateIndex = -1;
        List<? extends Object[]> stateCollection = null;

        if (iterateFacets && parent.getFacetCount() > 0) {
            Iterator<UIComponent> childIterator = parent.getFacets().values().iterator();

            while (childIterator.hasNext()) {
                UIComponent component = childIterator.next();

                // reset the client id (see spec 3.1.6)
                component.setId(component.getId());
                if (!component.isTransient()) {
                    if (descendantStateIndex == -1) {
                        stateCollection = ((List<? extends Object[]>) state);
                        descendantStateIndex = stateCollection.isEmpty() ? -1 : 0;
                    }

                    if (descendantStateIndex != -1 && descendantStateIndex < stateCollection.size()) {
                        Object[] object = stateCollection.get(descendantStateIndex);
                        if (component instanceof EditableValueHolder) {
                            EditableValueHolderState evhState = (EditableValueHolderState) object[0];
                            if (evhState == null) {
                                evhState = EditableValueHolderState.EMPTY;
                            }
                            evhState.restoreState((EditableValueHolder) component);
                        }

                        // If there is descendant state to restore, call it recursively, otherwise
                        // it is safe to skip iteration.
                        if (object[1] != null) {
                            restoreDescendantComponentStates(component, restoreChildFacets, object[1], true);
                        } else {
                            restoreDescendantComponentWithoutRestoreState(component, restoreChildFacets, true);
                        }
                    } else {
                        restoreDescendantComponentWithoutRestoreState(component, restoreChildFacets, true);
                    }
                    descendantStateIndex++;
                }
            }
        }

        if (parent.getChildCount() > 0) {
            for (int i = 0; i < parent.getChildCount(); i++) {
                UIComponent component = parent.getChildren().get(i);

                // reset the client id (see spec 3.1.6)
                component.setId(component.getId());
                if (!component.isTransient()) {
                    if (descendantStateIndex == -1) {
                        stateCollection = ((List<? extends Object[]>) state);
                        descendantStateIndex = stateCollection.isEmpty() ? -1 : 0;
                    }

                    if (descendantStateIndex != -1 && descendantStateIndex < stateCollection.size()) {
                        Object[] object = stateCollection.get(descendantStateIndex);
                        if (component instanceof EditableValueHolder) {
                            EditableValueHolderState evhState = (EditableValueHolderState) object[0];
                            if (evhState == null) {
                                evhState = EditableValueHolderState.EMPTY;
                            }
                            evhState.restoreState((EditableValueHolder) component);
                        }

                        // If there is descendant state to restore, call it recursively, otherwise
                        // it is safe to skip iteration.
                        if (object[1] != null) {
                            restoreDescendantComponentStates(component, restoreChildFacets, object[1], true);
                        } else {
                            restoreDescendantComponentWithoutRestoreState(component, restoreChildFacets, true);
                        }
                    } else {
                        restoreDescendantComponentWithoutRestoreState(component, restoreChildFacets, true);
                    }
                    descendantStateIndex++;
                }
            }
        }
    }

    /**
     * Just call component.setId(component.getId()) to reset all client ids and
     * ensure they will be calculated for the current row, but do not waste time
     * dealing with row state code.
     * 
     * @param parent
     * @param iterateFacets
     * @param restoreChildFacets
     */
    protected void restoreDescendantComponentWithoutRestoreState(UIComponent parent, boolean iterateFacets,
            boolean restoreChildFacets) {
        if (iterateFacets && parent.getFacetCount() > 0) {
            Iterator<UIComponent> childIterator = parent.getFacets().values().iterator();

            while (childIterator.hasNext()) {
                UIComponent component = childIterator.next();

                // reset the client id (see spec 3.1.6)
                component.setId(component.getId());
                if (!component.isTransient()) {
                    restoreDescendantComponentWithoutRestoreState(component, restoreChildFacets, true);
                }
            }
        }

        if (parent.getChildCount() > 0) {
            for (int i = 0; i < parent.getChildCount(); i++) {
                UIComponent component = parent.getChildren().get(i);

                // reset the client id (see spec 3.1.6)
                component.setId(component.getId());
                if (!component.isTransient()) {
                    restoreDescendantComponentWithoutRestoreState(component, restoreChildFacets, true);
                }
            }
        }
    }

    /**
     * Walk the tree of child components of this UIData, saving the parts of their
     * state that can vary between rows.
     * <p>
     * This is very similar to the process that occurs for normal components when
     * the view is serialized. Transient
     * components are skipped (no state is saved for them).
     * <p>
     * If there are no children then null is returned. If there are one or more
     * children, and all children are transient
     * then an empty collection is returned; this will happen whenever a table
     * contains only read-only components.
     * <p>
     * Otherwise a collection is returned which contains an object for every
     * non-transient child component; that object
     * may itself contain a collection of the state of that child's child
     * components.
     */
    protected Collection<Object[]> saveDescendantComponentStates(UIComponent parent, boolean iterateFacets,
            boolean saveChildFacets) {
        Collection<Object[]> childStates = null;
        // Index to indicate how many components has been passed without state to save.
        int childEmptyIndex = 0;
        int totalChildCount = 0;

        if (iterateFacets && parent.getFacetCount() > 0) {
            Iterator<UIComponent> childIterator = parent.getFacets().values().iterator();

            while (childIterator.hasNext()) {
                UIComponent child = childIterator.next();
                if (!child.isTransient()) {
                    // Add an entry to the collection, being an array of two
                    // elements. The first element is the state of the children
                    // of this component; the second is the state of the current
                    // child itself.
                    if (child instanceof EditableValueHolder) {
                        if (childStates == null) {
                            childStates = new ArrayList<>(
                                    parent.getFacetCount()
                                            + parent.getChildCount()
                                            - totalChildCount
                                            + childEmptyIndex);
                            for (int ci = 0; ci < childEmptyIndex; ci++) {
                                childStates.add(LEAF_NO_STATE);
                            }
                        }

                        childStates.add(child.getChildCount() > 0
                                ? new Object[] { EditableValueHolderState.create((EditableValueHolder) child),
                                        saveDescendantComponentStates(child, saveChildFacets, true) }
                                : new Object[] { EditableValueHolderState.create((EditableValueHolder) child), null });
                    } else if (child.getChildCount() > 0 || (saveChildFacets && child.getFacetCount() > 0)) {
                        Object descendantSavedState = saveDescendantComponentStates(child, saveChildFacets, true);

                        if (descendantSavedState == null) {
                            if (childStates == null) {
                                childEmptyIndex++;
                            } else {
                                childStates.add(LEAF_NO_STATE);
                            }
                        } else {
                            if (childStates == null) {
                                childStates = new ArrayList<>(
                                        parent.getFacetCount()
                                                + parent.getChildCount()
                                                - totalChildCount
                                                + childEmptyIndex);
                                for (int ci = 0; ci < childEmptyIndex; ci++) {
                                    childStates.add(LEAF_NO_STATE);
                                }
                            }
                            childStates.add(new Object[] { null, descendantSavedState });
                        }
                    } else {
                        if (childStates == null) {
                            childEmptyIndex++;
                        } else {
                            childStates.add(LEAF_NO_STATE);
                        }
                    }
                }
                totalChildCount++;
            }
        }

        if (parent.getChildCount() > 0) {
            for (int i = 0; i < parent.getChildCount(); i++) {
                UIComponent child = parent.getChildren().get(i);
                if (!child.isTransient()) {
                    // Add an entry to the collection, being an array of two
                    // elements. The first element is the state of the children
                    // of this component; the second is the state of the current
                    // child itself.

                    if (child instanceof EditableValueHolder) {
                        if (childStates == null) {
                            childStates = new ArrayList<>(
                                    parent.getFacetCount()
                                            + parent.getChildCount()
                                            - totalChildCount
                                            + childEmptyIndex);
                            for (int ci = 0; ci < childEmptyIndex; ci++) {
                                childStates.add(LEAF_NO_STATE);
                            }
                        }

                        childStates.add(child.getChildCount() > 0
                                ? new Object[] { EditableValueHolderState.create((EditableValueHolder) child),
                                        saveDescendantComponentStates(child, saveChildFacets, true) }
                                : new Object[] { EditableValueHolderState.create((EditableValueHolder) child), null });
                    } else if (child.getChildCount() > 0 || (saveChildFacets && child.getFacetCount() > 0)) {
                        Object descendantSavedState = saveDescendantComponentStates(child, saveChildFacets, true);
                        if (descendantSavedState == null) {
                            if (childStates == null) {
                                childEmptyIndex++;
                            } else {
                                childStates.add(LEAF_NO_STATE);
                            }
                        } else {
                            if (childStates == null) {
                                childStates = new ArrayList<>(
                                        parent.getFacetCount()
                                                + parent.getChildCount()
                                                - totalChildCount
                                                + childEmptyIndex);
                                for (int ci = 0; ci < childEmptyIndex; ci++) {
                                    childStates.add(LEAF_NO_STATE);
                                }
                            }
                            childStates.add(new Object[] { null, descendantSavedState });
                        }
                    } else {
                        if (childStates == null) {
                            childEmptyIndex++;
                        } else {
                            childStates.add(LEAF_NO_STATE);
                        }
                    }
                }
                totalChildCount++;
            }
        }

        return childStates;
    }

    protected void restoreTransientDescendantComponentStates(FacesContext facesContext,
            Iterator<UIComponent> childIterator,
            Map<String, Object> state,
            boolean restoreChildFacets) {
        while (childIterator.hasNext()) {
            UIComponent component = childIterator.next();

            // reset the client id (see spec 3.1.6)
            component.setId(component.getId());
            if (!component.isTransient()) {
                component.restoreTransientState(facesContext,
                        state == null ? null : state.get(component.getClientId(facesContext)));

                Iterator<UIComponent> childsIterator = restoreChildFacets
                        ? component.getFacetsAndChildren()
                        : component.getChildren().iterator();
                restoreTransientDescendantComponentStates(facesContext, childsIterator, state, true);
            }
        }

    }

    protected Map<String, Object> saveTransientDescendantComponentStates(FacesContext facesContext,
            Map<String, Object> childStates,
            Iterator<UIComponent> childIterator,
            boolean saveChildFacets) {
        while (childIterator.hasNext()) {
            UIComponent child = childIterator.next();
            if (!child.isTransient()) {
                Iterator<UIComponent> childsIterator = saveChildFacets
                        ? child.getFacetsAndChildren()
                        : child.getChildren().iterator();
                childStates = saveTransientDescendantComponentStates(facesContext, childStates, childsIterator, true);
                Object state = child.saveTransientState(facesContext);
                if (state != null) {
                    if (childStates == null) {
                        childStates = new HashMap<>();
                    }
                    childStates.put(child.getClientId(facesContext), state);
                }
            }
        }
        return childStates;
    }

    protected Map<String, Object> saveFullDescendantComponentStates(FacesContext facesContext,
            Map<String, Object> stateMap,
            Iterator<UIComponent> childIterator, boolean saveChildFacets) {
        while (childIterator.hasNext()) {
            UIComponent child = childIterator.next();
            if (!child.isTransient()) {
                // Add an entry to the collection, being an array of two
                // elements. The first element is the state of the children
                // of this component; the second is the state of the current
                // child itself.
                Iterator<UIComponent> childsIterator = saveChildFacets
                        ? child.getFacetsAndChildren()
                        : child.getChildren().iterator();
                stateMap = saveFullDescendantComponentStates(facesContext, stateMap, childsIterator, true);
                Object state = child.saveState(facesContext);
                if (state != null) {
                    if (stateMap == null) {
                        stateMap = new HashMap<>();
                    }
                    stateMap.put(child.getClientId(facesContext), state);
                }
            }
        }
        return stateMap;
    }

    /**
     * Indicates whether the state for a component in each row should not be
     * discarded before the datatable is rendered again.
     * 
     * This will only work reliable if the datamodel of the
     * datatable did not change either by sorting, removing or
     * adding rows. Default: false
     * 
     * @return
     */
    @JSFProperty(literalOnly = true, faceletsOnly = true)
    public boolean isRowStatePreserved() {
        Boolean b = (Boolean) getStateHelper().get(PropertyKeys.rowStatePreserved);
        return b == null ? false : b;
    }

    public void setRowStatePreserved(boolean preserveComponentState) {
        getStateHelper().put(PropertyKeys.rowStatePreserved, preserveComponentState);
    }

    @Override
    public void markInitialState() {
        if (isRowStatePreserved() &&
                getFacesContext().getAttributes().containsKey(StateManager.IS_BUILDING_INITIAL_STATE)) {
            _initialDescendantFullComponentState = saveDescendantInitialComponentStates(getFacesContext(),
                    getChildren().iterator(), false);
        }
        super.markInitialState();
    }

    private Collection<Object[]> saveDescendantInitialComponentStates(FacesContext facesContext,
            Iterator<UIComponent> childIterator, boolean saveChildFacets) {
        Collection<Object[]> childStates = null;
        while (childIterator.hasNext()) {
            UIComponent child = childIterator.next();
            if (!child.isTransient()) {
                Iterator<UIComponent> childsIterator = saveChildFacets
                        ? child.getFacetsAndChildren()
                        : child.getChildren().iterator();
                Object descendantState = saveDescendantInitialComponentStates(facesContext, childsIterator, true);
                Object state = null;
                if (child.initialStateMarked()) {
                    child.clearInitialState();
                    state = child.saveState(facesContext);
                    child.markInitialState();
                } else {
                    state = child.saveState(facesContext);
                }

                // Add an entry to the collection, being an array of two elements.
                // The first element is the state of the children of this component;
                // the second is the state of the current child itself.
                if (childStates == null) {
                    childStates = new ArrayList<>();
                }
                childStates.add(new Object[] { state, descendantState, child.getId() });
            }
        }
        return childStates;
    }

    protected void restoreFullDescendantComponentStates(FacesContext facesContext,
            Iterator<UIComponent> childIterator, Object initialState,
            boolean restoreChildFacets) {
        Iterator<? extends Object[]> descendantStateIterator = null;
        while (childIterator.hasNext()) {
            if (descendantStateIterator == null && initialState != null) {
                descendantStateIterator = ((Collection<? extends Object[]>) initialState).iterator();
            }

            UIComponent component = childIterator.next();
            // reset the client id (see spec 3.1.6)
            component.setId(component.getId());

            if (!component.isTransient()) {
                Object childState = null;
                Object descendantState = null;
                String childId = null;
                if (descendantStateIterator != null && descendantStateIterator.hasNext()) {
                    do {
                        Object[] object = descendantStateIterator.next();
                        childState = object[0];
                        descendantState = object[1];
                        childId = (String) object[2];
                    } while (descendantStateIterator.hasNext() && !component.getId().equals(childId));

                    if (!component.getId().equals(childId)) {
                        // cannot apply initial state to components correctly.
                        throw new IllegalStateException("Cannot restore row correctly.");
                    }
                }

                component.clearInitialState();
                component.restoreState(facesContext, childState);
                component.markInitialState();

                Iterator<UIComponent> childsIterator = restoreChildFacets
                        ? component.getFacetsAndChildren()
                        : component.getChildren().iterator();
                restoreFullDescendantComponentStates(facesContext, childsIterator, descendantState, true);
            }
        }
    }

    protected void restoreFullDescendantComponentDeltaStates(FacesContext facesContext,
            Iterator<UIComponent> childIterator, Map<String, Object> state, Object initialState,
            boolean restoreChildFacets) {
        Iterator<? extends Object[]> descendantFullStateIterator = null;
        while (childIterator.hasNext()) {
            if (descendantFullStateIterator == null && initialState != null) {
                descendantFullStateIterator = ((Collection<? extends Object[]>) initialState).iterator();
            }

            UIComponent component = childIterator.next();
            // reset the client id (see spec 3.1.6)
            component.setId(component.getId());

            if (!component.isTransient()) {
                Object childInitialState = null;
                Object descendantInitialState = null;
                Object childState = null;
                String childId = null;
                childState = (state == null) ? null : state.get(component.getClientId(facesContext));

                if (descendantFullStateIterator != null && descendantFullStateIterator.hasNext()) {
                    do {
                        Object[] object = descendantFullStateIterator.next();
                        childInitialState = object[0];
                        descendantInitialState = object[1];
                        childId = (String) object[2];
                    } while (descendantFullStateIterator.hasNext() && !component.getId().equals(childId));

                    if (!component.getId().equals(childId)) {
                        // cannot apply initial state to components correctly. State is corrupt
                        throw new IllegalStateException("Cannot restore row correctly.");
                    }
                }

                component.clearInitialState();
                if (childInitialState != null) {
                    component.restoreState(facesContext, childInitialState);
                    component.markInitialState();
                    component.restoreState(facesContext, childState);
                } else {
                    component.restoreState(facesContext, childState);
                    component.markInitialState();
                }

                Iterator<UIComponent> childsIterator = restoreChildFacets
                        ? component.getFacetsAndChildren()
                        : component.getChildren().iterator();
                restoreFullDescendantComponentDeltaStates(facesContext, childsIterator, state,
                        descendantInitialState, true);
            }
        }
    }

    enum PropertyKeys {
        rowStatePreserved
    }

}
