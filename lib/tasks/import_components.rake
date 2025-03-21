namespace :rackit do
  desc 'Import component fixtures into development database'
  task import_components: :environment do
    # Path to your fixture file
    fixture_file = Rails.root.join('component_fixtures.yml')
    
    if File.exist?(fixture_file)
      components = YAML.load_file(fixture_file)
      
      ActiveRecord::Base.transaction do
        components.each_with_index do |(key, attributes), index|
          # Create component with the attributes from the fixture
          # Set a consistent user reference
          user = User.first
          
          # Skip the id to let the database assign it
          component_attrs = attributes.except('id', 'user')
          component_attrs['user_id'] = user.id if user

          # Find or create the component
          component = Component.create!(component_attrs)
          puts "Imported component: #{component.name}"
        end
      end
      
      puts "Successfully imported #{components.size} components"
    else
      puts "Fixture file not found at #{fixture_file}"
    end
  end
end