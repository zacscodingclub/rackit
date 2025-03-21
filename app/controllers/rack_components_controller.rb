class RackComponentsController < ApplicationController
  before_action :set_server_rack
  before_action :set_rack_component, only: [:update, :destroy]

  def create
    @component = Component.find(params[:component_id])
    @rack_component = @server_rack.rack_components.build(rack_component_params)
    @rack_component.component = @component

    respond_to do |format|
      if @rack_component.save
        format.html { redirect_to @server_rack, notice: 'Component was successfully added to rack.' }
        format.json { render json: @rack_component, status: :created }
      else
        error_message = @rack_component.errors.full_messages.join(". ")
        format.html { redirect_to @server_rack, alert: "Failed to add component to rack: #{error_message}" }
        format.json { render json: @rack_component.errors, status: :unprocessable_entity }
      end
    end
  end

  def update
    respond_to do |format|
      old_position = @rack_component.position_y_was # Get the previous position
      component_id = @rack_component.id
      
      if @rack_component.update(rack_component_params)
        # Prepare data for the turbo_stream template
        @rack_components_by_position = @server_rack.rack_components
          .includes(:component)
          .order(:position_y)
          .group_by(&:position_y)
          
        # Also load rack_components for server_visualization partial
        @rack_components = @server_rack.rack_components.includes(:component).order(:position_y)
        
        # Save moved component data for targeted update
        @moved_component = {
          id: component_id,
          old_position: old_position,
          new_position: @rack_component.position_y,
          height: @rack_component.component.height
        }
        
        format.html { redirect_to @server_rack, notice: 'Component position was successfully updated.' }
        format.json { render json: @rack_component, status: :ok }
        format.js { head :ok } # Support for AJAX requests
        format.turbo_stream # Renders update.turbo_stream.erb
      else
        error_message = @rack_component.errors.full_messages.join(". ")
        format.html { redirect_to @server_rack, alert: "Failed to update component position: #{error_message}" }
        format.json { render json: @rack_component.errors, status: :unprocessable_entity }
        format.js { render json: @rack_component.errors, status: :unprocessable_entity }
        format.turbo_stream { render turbo_stream: turbo_stream.update("notifications", 
          partial: "shared/error", 
          locals: { error: "Failed to update position: #{error_message}" }) 
        }
      end
    end
  end

  def destroy
    @rack_component.destroy
    respond_to do |format|
      format.html { redirect_to @server_rack, notice: 'Component was successfully removed from rack.' }
      format.json { head :no_content }
    end
  end

  private
    def set_server_rack
      @server_rack = ServerRack.find(params[:server_rack_id])
    end

    def set_rack_component
      @rack_component = @server_rack.rack_components.find(params[:id])
    end

    def rack_component_params
      # Allow JSON params for drag-and-drop updates
      if request.content_type =~ /json/
        # Log to debug JSON parsing
        Rails.logger.debug "JSON Request Body: #{request.body.read}"
        request.body.rewind
        
        # Parse JSON from request body if needed
        json_params = begin
          JSON.parse(request.body.read)
        rescue JSON::ParserError
          {}
        end
        request.body.rewind
        
        # Try different approaches to get the params
        if params[:position_y].present?
          params.permit(:position_y, :component_id)
        elsif json_params["position_y"].present?
          { position_y: json_params["position_y"] }
        else
          # Fall back to permitting all relevant params
          params.permit(:position_y, :component_id)
        end
      else
        params.permit(:position_y, :component_id)
      end
    end
end
